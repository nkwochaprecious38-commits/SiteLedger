-- SiteLedger schema: multi workspace construction management.
-- Lives in its own "siteledger" schema so it can share a Supabase project with other apps.
-- After running: Project Settings > API > Exposed schemas > add "siteledger", then save.
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;
create schema if not exists siteledger;

-- ---------------------------------------------------------------
-- Tenancy and identity
-- ---------------------------------------------------------------
create table siteledger.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  address text,
  phone text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.workspaces (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references siteledger.companies(id) on delete cascade,
  name text not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  job_title text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.workspace_members (
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  user_id uuid not null references siteledger.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','manager','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index on siteledger.workspace_members (user_id);

-- ---------------------------------------------------------------
-- Access helper functions (security definer avoids RLS recursion)
-- ---------------------------------------------------------------
create or replace function siteledger.is_workspace_member(ws uuid) returns boolean
language sql stable security definer set search_path = siteledger as $$
  select exists (select 1 from siteledger.workspace_members where workspace_id = ws and user_id = auth.uid());
$$;

create or replace function siteledger.can_write(ws uuid) returns boolean
language sql stable security definer set search_path = siteledger as $$
  select exists (select 1 from siteledger.workspace_members
    where workspace_id = ws and user_id = auth.uid() and role in ('owner','admin','manager','member'));
$$;

create or replace function siteledger.is_workspace_admin(ws uuid) returns boolean
language sql stable security definer set search_path = siteledger as $$
  select exists (select 1 from siteledger.workspace_members
    where workspace_id = ws and user_id = auth.uid() and role in ('owner','admin'));
$$;

-- ---------------------------------------------------------------
-- Operational tables
-- ---------------------------------------------------------------
create table siteledger.team_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  user_id uuid references siteledger.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  role text not null default 'Site Supervisor',
  status text not null default 'Active' check (status in ('Active','Invited','Inactive')),
  project_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  name text not null,
  description text,
  location text,
  client text,
  manager_id uuid references siteledger.team_members(id) on delete set null,
  category text not null default 'Commercial',
  status text not null default 'Planning' check (status in ('Planning','Active','On Hold','At Risk','Completed')),
  start_date date,
  end_date date,
  budget numeric(14,2) not null default 0 check (budget >= 0),
  progress integer not null default 0 check (progress between 0 and 100),
  image_url text,
  created_by uuid references siteledger.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid not null references siteledger.projects(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid references siteledger.projects(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references siteledger.team_members(id) on delete set null,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High','Urgent')),
  status text not null default 'To Do' check (status in ('To Do','In Progress','Under Review','Completed')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  entity_type text not null check (entity_type in ('task','issue')),
  entity_id uuid not null,
  author_name text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.daily_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid references siteledger.projects(id) on delete cascade,
  report_date date not null default current_date,
  supervisor text,
  weather text,
  activities text,
  workforce integer not null default 0 check (workforce >= 0),
  equipment text,
  materials_delivered text,
  safety text,
  issues text,
  delays text,
  notes text,
  photos text[] not null default '{}',
  status text not null default 'Draft' check (status in ('Draft','Submitted','Approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid references siteledger.projects(id) on delete set null,
  name text not null,
  category text not null default 'General Documents',
  folder text not null default 'General',
  description text,
  storage_path text,
  file_size bigint,
  mime_type text,
  uploaded_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid not null references siteledger.projects(id) on delete cascade,
  category text not null,
  planned numeric(14,2) not null default 0 check (planned >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, category)
);

create table siteledger.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid not null references siteledger.projects(id) on delete cascade,
  category text not null,
  description text not null,
  vendor text,
  amount numeric(14,2) not null check (amount >= 0),
  expense_date date not null default current_date,
  status text not null default 'Pending' check (status in ('Pending','Approved','Rejected')),
  receipt_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.materials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid references siteledger.projects(id) on delete set null,
  name text not null,
  description text,
  quantity numeric(14,2) not null default 0 check (quantity >= 0),
  unit text not null default 'units',
  cost_per_unit numeric(14,2) not null default 0 check (cost_per_unit >= 0),
  supplier text,
  reorder_level numeric(14,2) not null default 0,
  delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.inventory_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  material_id uuid not null references siteledger.materials(id) on delete cascade,
  project_id uuid references siteledger.projects(id) on delete set null,
  kind text not null check (kind in ('delivery','usage','adjustment')),
  quantity numeric(14,2) not null,
  record_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.contractors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  company_name text not null,
  contact_person text,
  email text,
  phone text,
  specialty text,
  address text,
  status text not null default 'Active' check (status in ('Active','Preferred','On Hold','Inactive')),
  notes text,
  project_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.issues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid references siteledger.projects(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'Medium' check (severity in ('Low','Medium','High','Critical')),
  status text not null default 'Open' check (status in ('Open','In Progress','Resolved','Closed')),
  assignee_id uuid references siteledger.team_members(id) on delete set null,
  due_date date,
  corrective_action text,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.inspections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid references siteledger.projects(id) on delete cascade,
  title text not null,
  inspection_date date not null default current_date,
  inspector text,
  findings text,
  corrective_actions text,
  status text not null default 'Scheduled' check (status in ('Scheduled','Passed','Action Required','Failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  user_id uuid not null references siteledger.profiles(id) on delete cascade,
  key text not null,
  read boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create table siteledger.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references siteledger.workspaces(id) on delete cascade,
  project_id uuid references siteledger.projects(id) on delete cascade,
  actor_name text,
  action text not null,
  entity_type text,
  entity_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table siteledger.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references siteledger.workspaces(id) on delete cascade,
  plan text not null default 'plan1' check (plan in ('plan1','plan2','plan3')),
  status text not null default 'pending_checkout' check (status in ('pending_checkout','active','past_due','cancelled')),
  external_reference text,
  current_period_end date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['team_members','projects','milestones','tasks','comments','daily_reports','documents','budgets','expenses','materials','inventory_records','contractors','issues','inspections','notifications','activity_logs']
  loop
    execute format('create index on siteledger.%I (workspace_id)', t);
  end loop;
end $$;
create index on siteledger.workspaces (company_id);
create index on siteledger.milestones (project_id);
create index on siteledger.tasks (project_id);
create index on siteledger.tasks (assignee_id);
create index on siteledger.tasks (status, due_date);
create index on siteledger.comments (entity_type, entity_id);
create index on siteledger.daily_reports (project_id, report_date desc);
create index on siteledger.documents (project_id);
create index on siteledger.expenses (project_id, expense_date desc);
create index on siteledger.materials (project_id);
create index on siteledger.inventory_records (material_id);
create index on siteledger.issues (project_id, status);
create index on siteledger.inspections (project_id);
create index on siteledger.activity_logs (workspace_id, created_at desc);

-- ---------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------
create or replace function siteledger.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['companies','workspaces','profiles','team_members','projects','milestones','tasks','comments','daily_reports','documents','budgets','expenses','materials','inventory_records','contractors','issues','inspections','notifications','activity_logs','subscriptions']
  loop
    execute format('create trigger touch_%1$s before update on siteledger.%1$I for each row execute function siteledger.touch_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------
alter table siteledger.companies enable row level security;
alter table siteledger.workspaces enable row level security;
alter table siteledger.profiles enable row level security;
alter table siteledger.workspace_members enable row level security;

create policy companies_select on siteledger.companies for select
  using (exists (select 1 from siteledger.workspaces w where w.company_id = companies.id and siteledger.is_workspace_member(w.id)));
create policy companies_update on siteledger.companies for update
  using (exists (select 1 from siteledger.workspaces w where w.company_id = companies.id and siteledger.is_workspace_admin(w.id)));

create policy workspaces_select on siteledger.workspaces for select using (siteledger.is_workspace_member(id));
create policy workspaces_update on siteledger.workspaces for update using (siteledger.is_workspace_admin(id));

create policy profiles_select on siteledger.profiles for select
  using (id = auth.uid() or exists (
    select 1 from siteledger.workspace_members a join siteledger.workspace_members b on a.workspace_id = b.workspace_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy profiles_update on siteledger.profiles for update using (id = auth.uid());

create policy members_select on siteledger.workspace_members for select using (siteledger.is_workspace_member(workspace_id));
create policy members_manage on siteledger.workspace_members for all
  using (siteledger.is_workspace_admin(workspace_id)) with check (siteledger.is_workspace_admin(workspace_id));

do $$
declare t text;
begin
  foreach t in array array['team_members','projects','milestones','tasks','comments','daily_reports','documents','budgets','expenses','materials','inventory_records','contractors','issues','inspections','activity_logs']
  loop
    execute format('alter table siteledger.%I enable row level security', t);
    execute format('create policy %I on siteledger.%I for select using (siteledger.is_workspace_member(workspace_id))', t || '_select', t);
    execute format('create policy %I on siteledger.%I for insert with check (siteledger.can_write(workspace_id))', t || '_insert', t);
    execute format('create policy %I on siteledger.%I for update using (siteledger.can_write(workspace_id)) with check (siteledger.can_write(workspace_id))', t || '_update', t);
    execute format('create policy %I on siteledger.%I for delete using (siteledger.can_write(workspace_id))', t || '_delete', t);
  end loop;
end $$;

-- notifications: private read state per user
alter table siteledger.notifications enable row level security;
create policy notifications_own on siteledger.notifications for all
  using (user_id = auth.uid() and siteledger.is_workspace_member(workspace_id))
  with check (user_id = auth.uid() and siteledger.is_workspace_member(workspace_id));

-- subscriptions: members read, admins change the selected plan
alter table siteledger.subscriptions enable row level security;
create policy subscriptions_select on siteledger.subscriptions for select using (siteledger.is_workspace_member(workspace_id));
create policy subscriptions_update on siteledger.subscriptions for update
  using (siteledger.is_workspace_admin(workspace_id)) with check (siteledger.is_workspace_admin(workspace_id));

-- Prevent clients from marking a subscription active: only service role / webhooks may.
create or replace function siteledger.guard_subscription() returns trigger language plpgsql security definer as $$
begin
  if auth.role() <> 'service_role' and new.status is distinct from old.status
     and new.status not in ('pending_checkout') then
    raise exception 'Subscription status can only be changed by the billing provider';
  end if;
  return new;
end $$;
create trigger guard_subscription before update on siteledger.subscriptions
  for each row execute function siteledger.guard_subscription();

-- ---------------------------------------------------------------
-- New user bootstrap: company, workspace, profile, owner membership, subscription
-- ---------------------------------------------------------------
create or replace function siteledger.handle_new_user() returns trigger
language plpgsql security definer set search_path = siteledger as $$
declare
  cid uuid; wid uuid;
  fname text := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1));
  cname text := coalesce(nullif(new.raw_user_meta_data->>'company_name',''), fname || ' Construction');
  chosen text := coalesce(new.raw_user_meta_data->>'plan','plan1');
begin
  if new.raw_user_meta_data->>'app' is distinct from 'siteledger' then return new; end if;
  if chosen not in ('plan1','plan2','plan3') then chosen := 'plan1'; end if;
  insert into siteledger.profiles (id, full_name, email) values (new.id, fname, new.email);
  insert into siteledger.companies (name) values (cname) returning id into cid;
  insert into siteledger.workspaces (company_id, name) values (cid, cname || ' Workspace') returning id into wid;
  insert into siteledger.workspace_members (workspace_id, user_id, role) values (wid, new.id, 'owner');
  insert into siteledger.team_members (workspace_id, user_id, name, email, role, status)
    values (wid, new.id, fname, new.email, 'Owner', 'Active');
  insert into siteledger.subscriptions (workspace_id, plan, status) values (wid, chosen, 'pending_checkout');
  return new;
end $$;

-- Creates a workspace for an existing auth user (for example one who signed up in another app
-- on this project) the first time they open SiteLedger. Idempotent.
create or replace function siteledger.ensure_workspace() returns uuid
language plpgsql security definer set search_path = siteledger as $$
declare
  uid uuid := auth.uid(); u record; cid uuid; wid uuid; fname text; cname text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select workspace_id into wid from siteledger.workspace_members where user_id = uid limit 1;
  if wid is not null then return wid; end if;
  select id, email, raw_user_meta_data from auth.users where id = uid into u;
  fname := coalesce(nullif(u.raw_user_meta_data->>'full_name',''), split_part(u.email,'@',1));
  cname := coalesce(nullif(u.raw_user_meta_data->>'company_name',''), fname || ' Construction');
  insert into siteledger.profiles (id, full_name, email) values (uid, fname, u.email) on conflict (id) do nothing;
  insert into siteledger.companies (name) values (cname) returning id into cid;
  insert into siteledger.workspaces (company_id, name) values (cid, cname || ' Workspace') returning id into wid;
  insert into siteledger.workspace_members (workspace_id, user_id, role) values (wid, uid, 'owner');
  insert into siteledger.team_members (workspace_id, user_id, name, email, role, status) values (wid, uid, fname, u.email, 'Owner', 'Active');
  insert into siteledger.subscriptions (workspace_id, plan, status) values (wid, 'plan1', 'pending_checkout');
  return wid;
end $$;
grant execute on function siteledger.ensure_workspace() to authenticated;

create trigger siteledger_on_auth_user_created after insert on auth.users
  for each row execute function siteledger.handle_new_user();

-- ---------------------------------------------------------------
-- Storage: private bucket, files stored under <workspace_id>/...
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('siteledger-files', 'siteledger-files', false)
  on conflict (id) do nothing;

create policy "siteledger files read" on storage.objects for select
  using (bucket_id = 'siteledger-files' and siteledger.is_workspace_member(((storage.foldername(name))[1])::uuid));
create policy "siteledger files insert" on storage.objects for insert
  with check (bucket_id = 'siteledger-files' and siteledger.can_write(((storage.foldername(name))[1])::uuid));
create policy "siteledger files update" on storage.objects for update
  using (bucket_id = 'siteledger-files' and siteledger.can_write(((storage.foldername(name))[1])::uuid));
create policy "siteledger files delete" on storage.objects for delete
  using (bucket_id = 'siteledger-files' and siteledger.can_write(((storage.foldername(name))[1])::uuid));

-- ---------------------------------------------------------------
-- Data API access (row level security still governs every row)
-- ---------------------------------------------------------------
grant usage on schema siteledger to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema siteledger to authenticated;
grant all on all tables in schema siteledger to service_role;
grant execute on all functions in schema siteledger to authenticated, service_role;
alter default privileges in schema siteledger grant select, insert, update, delete on tables to authenticated;
