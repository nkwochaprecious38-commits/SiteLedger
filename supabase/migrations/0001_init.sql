-- SiteLedger schema: multi workspace construction management.
-- Run in the Supabase SQL editor (or `supabase db push`).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------
-- Tenancy and identity
-- ---------------------------------------------------------------
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  address text,
  phone text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  currency text not null default 'USD',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  job_title text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','manager','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index on public.workspace_members (user_id);

-- ---------------------------------------------------------------
-- Access helper functions (security definer avoids RLS recursion)
-- ---------------------------------------------------------------
create or replace function public.is_workspace_member(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where workspace_id = ws and user_id = auth.uid());
$$;

create or replace function public.can_write(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid() and role in ('owner','admin','manager','member'));
$$;

create or replace function public.is_workspace_admin(ws uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members
    where workspace_id = ws and user_id = auth.uid() and role in ('owner','admin'));
$$;

-- ---------------------------------------------------------------
-- Operational tables
-- ---------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  role text not null default 'Site Supervisor',
  status text not null default 'Active' check (status in ('Active','Invited','Inactive')),
  project_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  location text,
  client text,
  manager_id uuid references public.team_members(id) on delete set null,
  category text not null default 'Commercial',
  status text not null default 'Planning' check (status in ('Planning','Active','On Hold','At Risk','Completed')),
  start_date date,
  end_date date,
  budget numeric(14,2) not null default 0 check (budget >= 0),
  progress integer not null default 0 check (progress between 0 and 100),
  image_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references public.team_members(id) on delete set null,
  priority text not null default 'Medium' check (priority in ('Low','Medium','High','Urgent')),
  status text not null default 'To Do' check (status in ('To Do','In Progress','Under Review','Completed')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  entity_type text not null check (entity_type in ('task','issue')),
  entity_id uuid not null,
  author_name text,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.daily_reports (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
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

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
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

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  planned numeric(14,2) not null default 0 check (planned >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, category)
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
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

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
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

create table public.inventory_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  kind text not null check (kind in ('delivery','usage','adjustment')),
  quantity numeric(14,2) not null,
  record_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contractors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
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

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'Medium' check (severity in ('Low','Medium','High','Critical')),
  status text not null default 'Open' check (status in ('Open','In Progress','Resolved','Closed')),
  assignee_id uuid references public.team_members(id) on delete set null,
  due_date date,
  corrective_action text,
  photos text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inspections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  inspection_date date not null default current_date,
  inspector text,
  findings text,
  corrective_actions text,
  status text not null default 'Scheduled' check (status in ('Scheduled','Passed','Action Required','Failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  key text not null,
  read boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  actor_name text,
  action text not null,
  entity_type text,
  entity_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references public.workspaces(id) on delete cascade,
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
    execute format('create index on public.%I (workspace_id)', t);
  end loop;
end $$;
create index on public.workspaces (company_id);
create index on public.milestones (project_id);
create index on public.tasks (project_id);
create index on public.tasks (assignee_id);
create index on public.tasks (status, due_date);
create index on public.comments (entity_type, entity_id);
create index on public.daily_reports (project_id, report_date desc);
create index on public.documents (project_id);
create index on public.expenses (project_id, expense_date desc);
create index on public.materials (project_id);
create index on public.inventory_records (material_id);
create index on public.issues (project_id, status);
create index on public.inspections (project_id);
create index on public.activity_logs (workspace_id, created_at desc);

-- ---------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['companies','workspaces','profiles','team_members','projects','milestones','tasks','comments','daily_reports','documents','budgets','expenses','materials','inventory_records','contractors','issues','inspections','notifications','activity_logs','subscriptions']
  loop
    execute format('create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------
alter table public.companies enable row level security;
alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_members enable row level security;

create policy companies_select on public.companies for select
  using (exists (select 1 from public.workspaces w where w.company_id = companies.id and public.is_workspace_member(w.id)));
create policy companies_update on public.companies for update
  using (exists (select 1 from public.workspaces w where w.company_id = companies.id and public.is_workspace_admin(w.id)));

create policy workspaces_select on public.workspaces for select using (public.is_workspace_member(id));
create policy workspaces_update on public.workspaces for update using (public.is_workspace_admin(id));

create policy profiles_select on public.profiles for select
  using (id = auth.uid() or exists (
    select 1 from public.workspace_members a join public.workspace_members b on a.workspace_id = b.workspace_id
    where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy profiles_update on public.profiles for update using (id = auth.uid());

create policy members_select on public.workspace_members for select using (public.is_workspace_member(workspace_id));
create policy members_manage on public.workspace_members for all
  using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));

do $$
declare t text;
begin
  foreach t in array array['team_members','projects','milestones','tasks','comments','daily_reports','documents','budgets','expenses','materials','inventory_records','contractors','issues','inspections','activity_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select using (public.is_workspace_member(workspace_id))', t || '_select', t);
    execute format('create policy %I on public.%I for insert with check (public.can_write(workspace_id))', t || '_insert', t);
    execute format('create policy %I on public.%I for update using (public.can_write(workspace_id)) with check (public.can_write(workspace_id))', t || '_update', t);
    execute format('create policy %I on public.%I for delete using (public.can_write(workspace_id))', t || '_delete', t);
  end loop;
end $$;

-- notifications: private read state per user
alter table public.notifications enable row level security;
create policy notifications_own on public.notifications for all
  using (user_id = auth.uid() and public.is_workspace_member(workspace_id))
  with check (user_id = auth.uid() and public.is_workspace_member(workspace_id));

-- subscriptions: members read, admins change the selected plan
alter table public.subscriptions enable row level security;
create policy subscriptions_select on public.subscriptions for select using (public.is_workspace_member(workspace_id));
create policy subscriptions_update on public.subscriptions for update
  using (public.is_workspace_admin(workspace_id)) with check (public.is_workspace_admin(workspace_id));

-- Prevent clients from marking a subscription active: only service role / webhooks may.
create or replace function public.guard_subscription() returns trigger language plpgsql security definer as $$
begin
  if auth.role() <> 'service_role' and new.status is distinct from old.status
     and new.status not in ('pending_checkout') then
    raise exception 'Subscription status can only be changed by the billing provider';
  end if;
  return new;
end $$;
create trigger guard_subscription before update on public.subscriptions
  for each row execute function public.guard_subscription();

-- ---------------------------------------------------------------
-- New user bootstrap: company, workspace, profile, owner membership, subscription
-- ---------------------------------------------------------------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cid uuid; wid uuid;
  fname text := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1));
  cname text := coalesce(nullif(new.raw_user_meta_data->>'company_name',''), fname || ' Construction');
  chosen text := coalesce(new.raw_user_meta_data->>'plan','plan1');
begin
  if chosen not in ('plan1','plan2','plan3') then chosen := 'plan1'; end if;
  insert into public.profiles (id, full_name, email) values (new.id, fname, new.email);
  insert into public.companies (name) values (cname) returning id into cid;
  insert into public.workspaces (company_id, name) values (cid, cname || ' Workspace') returning id into wid;
  insert into public.workspace_members (workspace_id, user_id, role) values (wid, new.id, 'owner');
  insert into public.team_members (workspace_id, user_id, name, email, role, status)
    values (wid, new.id, fname, new.email, 'Owner', 'Active');
  insert into public.subscriptions (workspace_id, plan, status) values (wid, chosen, 'pending_checkout');
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- Storage: private bucket, files stored under <workspace_id>/...
-- ---------------------------------------------------------------
insert into storage.buckets (id, name, public) values ('siteledger-files', 'siteledger-files', false)
  on conflict (id) do nothing;

create policy "files read" on storage.objects for select
  using (bucket_id = 'siteledger-files' and public.is_workspace_member(((storage.foldername(name))[1])::uuid));
create policy "files insert" on storage.objects for insert
  with check (bucket_id = 'siteledger-files' and public.can_write(((storage.foldername(name))[1])::uuid));
create policy "files update" on storage.objects for update
  using (bucket_id = 'siteledger-files' and public.can_write(((storage.foldername(name))[1])::uuid));
create policy "files delete" on storage.objects for delete
  using (bucket_id = 'siteledger-files' and public.can_write(((storage.foldername(name))[1])::uuid));
