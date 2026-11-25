"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { daysFromToday, stockStatus, sum } from "@/lib/utils";

export type Row = Record<string, any>;
export const TABLES = [
  "projects", "milestones", "tasks", "comments", "daily_reports", "documents", "budgets", "expenses",
  "materials", "inventory_records", "team_members", "contractors", "issues", "inspections", "notifications", "activity_logs",
] as const;
export type Table = (typeof TABLES)[number];

const LABELS: Partial<Record<Table, string>> = {
  projects: "project", tasks: "task", daily_reports: "daily report", documents: "document", expenses: "expense",
  budgets: "budget line", materials: "material", team_members: "team member", contractors: "contractor",
  issues: "issue", inspections: "inspection", milestones: "milestone", comments: "comment",
};
const nameOf = (t: Table, r: Row) => r.name || r.title || r.company_name || r.description || (t === "daily_reports" ? `Report ${r.report_date}` : t);

export interface AppNotification { key: string; type: string; title: string; body: string; href: string; read: boolean; severity: "info" | "warn" | "bad" }
interface Toast { id: number; kind: "ok" | "bad"; text: string }

interface Ctx {
  user: Row; profile: Row; workspace: Row; company: Row; role: string; subscription: Row | null;
  data: Record<Table, Row[]>; loading: boolean;
  reload: () => Promise<void>;
  create: (t: Table, row: Row) => Promise<Row | null>;
  update: (t: Table, id: string, patch: Row) => Promise<boolean>;
  remove: (t: Table, id: string) => Promise<boolean>;
  upload: (file: File, folder: string) => Promise<string | null>;
  signedUrl: (path: string) => Promise<string | null>;
  notify: (kind: "ok" | "bad", text: string) => void;
  notifications: AppNotification[];
  markRead: (keys: string[]) => Promise<void>;
  patchLocal: (key: "profile" | "company" | "workspace" | "subscription", v: Row) => void;
  canWrite: boolean;
  signOut: () => Promise<void>;
  seedDemo: () => Promise<void>;
}
const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside DataProvider");
  return c;
};
const emptyData = () => Object.fromEntries(TABLES.map((t) => [t, [] as Row[]])) as Record<Table, Row[]>;

export function DataProvider({ children, seed }: { children: ReactNode; seed: (ctx: { workspaceId: string; actor: string; db: ReturnType<typeof supabaseBrowser> }) => Promise<void> }) {
  const sb = supabaseBrowser();
  const router = useRouter();
  const [boot, setBoot] = useState<{ user: Row; profile: Row; workspace: Row; company: Row; role: string; subscription: Row | null } | null>(null);
  const [data, setData] = useState<Record<Table, Row[]>>(emptyData);
  const [loading, setLoading] = useState(true);
  const [fatal, setFatal] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((kind: "ok" | "bad", text: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const loadAll = useCallback(async (workspaceId: string) => {
    const results = await Promise.all(
      TABLES.map((t) => {
        let q = sb.from(t).select("*").eq("workspace_id", workspaceId);
        q = t === "activity_logs" ? q.order("created_at", { ascending: false }).limit(200) : q.order("created_at", { ascending: false }).limit(2000);
        return q;
      })
    );
    const next = emptyData();
    results.forEach((r, i) => { if (r.error) console.error(TABLES[i], r.error.message); next[TABLES[i]] = r.data || []; });
    setData(next);
  }, [sb]);

  useEffect(() => {
    (async () => {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) { router.replace("/login"); return; }
      const [{ data: profile }, { data: mem, error }] = await Promise.all([
        sb.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        sb.from("workspace_members").select("role, workspaces(*, companies(*))").eq("user_id", u.user.id).limit(1),
      ]);
      const m: any = mem?.[0];
      if (error || !m?.workspaces) {
        setFatal(error?.message || "No workspace was found for this account. Confirm that supabase/migrations/0001_init.sql has been applied to your project.");
        setLoading(false);
        return;
      }
      const ws = m.workspaces;
      const { data: subscription } = await sb.from("subscriptions").select("*").eq("workspace_id", ws.id).maybeSingle();
      setBoot({ user: u.user as Row, profile: profile || { id: u.user.id, email: u.user.email, full_name: u.user.email }, workspace: ws, company: ws.companies, role: m.role, subscription });
      await loadAll(ws.id);
      setLoading(false);
    })();
  }, [sb, router, loadAll]);

  const actor = boot?.profile?.full_name || boot?.user?.email || "User";
  const wid = boot?.workspace?.id as string;
  const canWrite = !!boot && boot.role !== "viewer";

  const log = useCallback(async (project_id: string | null, action: string, entity_type: string, entity_name: string) => {
    const { data: row } = await sb.from("activity_logs").insert({ workspace_id: wid, project_id, actor_name: actor, action, entity_type, entity_name }).select().single();
    if (row) setData((d) => ({ ...d, activity_logs: [row, ...d.activity_logs] }));
  }, [sb, wid, actor]);

  const create = useCallback(async (t: Table, row: Row) => {
    const { data: r, error } = await sb.from(t).insert({ ...row, workspace_id: wid }).select().single();
    if (error) { notify("bad", error.message); return null; }
    setData((d) => ({ ...d, [t]: [r, ...d[t]] }));
    if (t !== "activity_logs" && t !== "notifications" && t !== "comments") log(r.project_id || (t === "projects" ? r.id : null), `Created ${LABELS[t] || t}`, t, nameOf(t, r));
    return r;
  }, [sb, wid, notify, log]);

  const update = useCallback(async (t: Table, id: string, patch: Row) => {
    const { data: r, error } = await sb.from(t).update(patch).eq("id", id).select().single();
    if (error) { notify("bad", error.message); return false; }
    setData((d) => ({ ...d, [t]: d[t].map((x) => (x.id === id ? r : x)) }));
    if (t !== "notifications" && t !== "comments") log(r.project_id || (t === "projects" ? r.id : null), `Updated ${LABELS[t] || t}`, t, nameOf(t, r));
    return true;
  }, [sb, notify, log]);

  const remove = useCallback(async (t: Table, id: string) => {
    const old = data[t].find((x) => x.id === id);
    const { error } = await sb.from(t).delete().eq("id", id);
    if (error) { notify("bad", error.message); return false; }
    if (t === "projects") await loadAll(wid);
    else setData((d) => ({ ...d, [t]: d[t].filter((x) => x.id !== id) }));
    if (old && t !== "projects") log(old.project_id || null, `Deleted ${LABELS[t] || t}`, t, nameOf(t, old));
    return true;
  }, [sb, data, notify, log, loadAll, wid]);

  const upload = useCallback(async (file: File, folder: string) => {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${wid}/${folder}/${Date.now()}_${safe}`;
    const { error } = await sb.storage.from("siteledger-files").upload(path, file, { contentType: file.type || undefined });
    if (error) { notify("bad", `Upload failed: ${error.message}`); return null; }
    return path;
  }, [sb, wid, notify]);

  const signedUrl = useCallback(async (path: string) => {
    const { data: s, error } = await sb.storage.from("siteledger-files").createSignedUrl(path, 300);
    if (error) { notify("bad", error.message); return null; }
    return s.signedUrl;
  }, [sb, notify]);

  const patchLocal = useCallback((key: "profile" | "company" | "workspace" | "subscription", v: Row) => {
    setBoot((b) => (b ? { ...b, [key]: { ...(b[key] || {}), ...v } } : b));
  }, []);

  // Notifications are derived from live workspace data. Read state is stored per user.
  const notifications = useMemo<AppNotification[]>(() => {
    if (!boot) return [];
    const readKeys = new Set(data.notifications.filter((n) => n.read).map((n) => n.key));
    const out: Omit<AppNotification, "read">[] = [];
    const projectName = (id: string) => data.projects.find((p) => p.id === id)?.name || "a project";
    const me = data.team_members.find((m) => m.user_id === boot.user.id);
    data.tasks.filter((t) => t.status !== "Completed").forEach((t) => {
      const d = daysFromToday(t.due_date);
      if (d === null) return;
      if (d < 0) out.push({ key: `overdue:${t.id}`, type: "Overdue task", title: t.title, body: `Overdue by ${-d} day${d === -1 ? "" : "s"} on ${projectName(t.project_id)}`, href: "/app/tasks", severity: "bad" });
      else if (d <= 3) out.push({ key: `due:${t.id}`, type: "Task deadline", title: t.title, body: d === 0 ? "Due today" : `Due in ${d} day${d === 1 ? "" : "s"}`, href: "/app/tasks", severity: "warn" });
      if (me && t.assignee_id === me.id) out.push({ key: `assigned:${t.id}`, type: "Task assignment", title: t.title, body: `Assigned to you on ${projectName(t.project_id)}`, href: "/app/tasks", severity: "info" });
    });
    data.projects.forEach((p) => {
      if (p.status === "At Risk") out.push({ key: `risk:${p.id}`, type: "Project status", title: p.name, body: "Project is marked At Risk", href: `/app/projects/${p.id}`, severity: "bad" });
      const spent = sum(data.expenses.filter((e) => e.project_id === p.id && e.status !== "Rejected"), "amount");
      if (Number(p.budget) > 0 && spent / Number(p.budget) >= 0.9) out.push({ key: `budget:${p.id}:${spent >= p.budget ? "over" : "90"}`, type: "Budget alert", title: p.name, body: `${Math.round((spent / p.budget) * 100)}% of budget used`, href: `/app/projects/${p.id}`, severity: "bad" });
    });
    data.milestones.filter((m) => !m.completed).forEach((m) => {
      const d = daysFromToday(m.due_date);
      if (d !== null && d >= 0 && d <= 14) out.push({ key: `ms:${m.id}`, type: "Upcoming milestone", title: m.title, body: `${projectName(m.project_id)}: due in ${d} day${d === 1 ? "" : "s"}`, href: `/app/projects/${m.project_id}`, severity: "warn" });
    });
    data.materials.forEach((m) => {
      const s = stockStatus(m);
      if (s !== "In Stock") out.push({ key: `stock:${m.id}:${s}`, type: "Low material stock", title: m.name, body: `${s}: ${m.quantity} ${m.unit} remaining`, href: "/app/materials", severity: "warn" });
    });
    data.issues.filter((i) => ["Open", "In Progress"].includes(i.status) && ["High", "Critical"].includes(i.severity)).forEach((i) =>
      out.push({ key: `issue:${i.id}`, type: "Issue needs attention", title: i.title, body: `${i.severity} severity on ${projectName(i.project_id)}`, href: "/app/issues", severity: "bad" }));
    data.daily_reports.filter((r) => r.status === "Submitted").slice(0, 5).forEach((r) =>
      out.push({ key: `report:${r.id}`, type: "Daily report submitted", title: projectName(r.project_id), body: `Report for ${r.report_date} awaiting approval`, href: "/app/reports", severity: "info" }));
    data.activity_logs.slice(0, 5).forEach((a) =>
      out.push({ key: `act:${a.id}`, type: "Project activity", title: `${a.action}: ${a.entity_name}`, body: `By ${a.actor_name}`, href: a.project_id ? `/app/projects/${a.project_id}` : "/app", severity: "info" }));
    return out.map((n) => ({ ...n, read: readKeys.has(n.key) }));
  }, [boot, data]);

  const markRead = useCallback(async (keys: string[]) => {
    if (!boot || !keys.length) return;
    const rows = keys.map((key) => ({ workspace_id: wid, user_id: boot.user.id, key, read: true }));
    const { data: saved, error } = await sb.from("notifications").upsert(rows, { onConflict: "user_id,key" }).select();
    if (error) { notify("bad", error.message); return; }
    setData((d) => ({ ...d, notifications: [...(saved || []), ...d.notifications.filter((n) => !keys.includes(n.key))] }));
  }, [sb, boot, wid, notify]);

  const signOut = useCallback(async () => {
    await sb.auth.signOut();
    router.replace("/login?signedout=1");
    router.refresh();
  }, [sb, router]);

  const reload = useCallback(async () => { if (wid) await loadAll(wid); }, [wid, loadAll]);

  const seedDemo = useCallback(async () => {
    await seed({ workspaceId: wid, actor, db: sb });
    await loadAll(wid);
    notify("ok", "Sample workspace data loaded");
  }, [seed, wid, actor, sb, loadAll, notify]);

  if (fatal) return (
    <div className="flex min-h-screen items-center justify-center bg-paper p-6">
      <div className="card max-w-lg p-8">
        <h1 className="text-xl font-bold">Workspace could not be loaded</h1>
        <p className="mt-3 text-sm text-muted">{fatal}</p>
        <button className="btn-dark mt-6" onClick={() => supabaseBrowser().auth.signOut().then(() => router.replace("/login"))}>Sign out</button>
      </div>
    </div>
  );
  if (!boot) return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="flex items-center gap-3 text-sm text-muted"><span className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-brand" />Loading your workspace</div>
    </div>
  );

  return (
    <AppCtx.Provider value={{ ...boot, data, loading, reload, create, update, remove, upload, signedUrl, notify, notifications, markRead, patchLocal, canWrite, signOut, seedDemo }}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-lg px-4 py-3 text-sm font-medium text-white shadow-lg ${t.kind === "ok" ? "bg-ok" : "bg-bad"}`}>{t.text}</div>
        ))}
      </div>
    </AppCtx.Provider>
  );
}
