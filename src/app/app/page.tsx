"use client";
import Link from "next/link";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, ClipboardList, DatabaseZap, ListChecks, Plus, Wallet, Receipt, ShieldAlert, FolderPlus, CalendarClock } from "lucide-react";
import { useApp } from "@/lib/data";
import { Badge, Empty, PageHeader, Progress, Stat } from "@/components/ui";
import { daysFromToday, fmtDate, money, sum, timeAgo } from "@/lib/utils";
import { spentFor, monthlySpend, CHART } from "@/lib/calc";
import { useState } from "react";

export default function Overview() {
  const { data, notifications, seedDemo, canWrite, profile, notify } = useApp();
  const [seeding, setSeeding] = useState(false);
  const m = useMemo(() => {
    const active = data.projects.filter((p) => ["Active", "At Risk", "On Hold", "Planning"].includes(p.status));
    const budget = sum(active, "budget");
    const spent = active.reduce((t, p) => t + spentFor(data.expenses, p.id), 0);
    const openTasks = data.tasks.filter((t) => t.status !== "Completed");
    const deadlines = [
      ...openTasks.filter((t) => t.due_date).map((t) => ({ id: "t" + t.id, title: t.title, date: t.due_date, kind: "Task", project: data.projects.find((p) => p.id === t.project_id)?.name })),
      ...data.milestones.filter((x) => !x.completed && x.due_date).map((x) => ({ id: "m" + x.id, title: x.title, date: x.due_date, kind: "Milestone", project: data.projects.find((p) => p.id === x.project_id)?.name })),
    ].sort((a, b) => a.date.localeCompare(b.date)).filter((d) => (daysFromToday(d.date) ?? 99) <= 21).slice(0, 7);
    return {
      active: data.projects.filter((p) => p.status === "Active").length,
      completed: data.projects.filter((p) => p.status === "Completed").length,
      risk: data.projects.filter((p) => p.status === "At Risk").length,
      budget, spent, openTasks: openTasks.length, overdue: openTasks.filter((t) => (daysFromToday(t.due_date) ?? 0) < 0 && t.due_date).length,
      milestones: data.milestones.filter((x) => !x.completed && (daysFromToday(x.due_date) ?? -1) >= 0 && (daysFromToday(x.due_date) ?? 99) <= 30).length,
      deadlines,
      chart: active.map((p) => ({ name: p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name, Budget: Number(p.budget), Spent: spentFor(data.expenses, p.id) })),
    };
  }, [data]);
  const trend = useMemo(() => monthlySpend(data.expenses), [data.expenses]);
  const alerts = notifications.filter((n) => !n.read && n.severity !== "info").slice(0, 5);

  if (!data.projects.length) {
    return (
      <div>
        <PageHeader title={`Welcome, ${profile?.full_name?.split(" ")[0] || "there"}`} subtitle="Your workspace is ready. Create your first project or load a sample portfolio to explore." />
        <div className="card"><Empty title="No projects yet" text="Start with a project, then add tasks, reports, budgets and documents to it. To explore the platform with realistic data first, load the sample portfolio into your workspace. You can delete it at any time."
          action={canWrite ? <div className="flex flex-wrap justify-center gap-3">
            <Link href="/app/projects?new=1" className="btn-primary"><Plus size={16} />Create a project</Link>
            <button className="btn-outline" disabled={seeding} onClick={async () => { setSeeding(true); try { await seedDemo(); } catch (e: any) { notify("bad", e.message); } setSeeding(false); }}><DatabaseZap size={16} />{seeding ? "Loading sample data" : "Load sample data"}</button>
          </div> : undefined} /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Overview" subtitle="A live summary of projects, costs and site activity across your workspace."
        actions={canWrite && <><Link href="/app/reports?new=1" className="btn-outline"><ClipboardList size={16} />Daily report</Link><Link href="/app/projects?new=1" className="btn-primary"><Plus size={16} />New project</Link></>} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Active projects" value={m.active} hint={`${data.projects.length} total`} />
        <Stat label="Completed projects" value={m.completed} />
        <Stat label="Projects at risk" value={m.risk} tone={m.risk ? "bad" : undefined} hint={m.risk ? "Needs attention" : "None flagged"} />
        <Stat label="Outstanding tasks" value={m.openTasks} tone={m.overdue ? "bad" : undefined} hint={`${m.overdue} overdue`} />
        <Stat label="Total budget (open projects)" value={money(m.budget, true)} />
        <Stat label="Total expenses" value={money(m.spent, true)} hint="Approved and pending" />
        <Stat label="Remaining budget" value={money(m.budget - m.spent, true)} tone={m.budget - m.spent < 0 ? "bad" : "ok"} />
        <Stat label="Milestones, next 30 days" value={m.milestones} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Budget versus spend by project</h2><Link href="/app/budget" className="text-xs font-semibold text-brand hover:underline">Budget details</Link></div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={m.chart} margin={{ left: -10, right: 4 }}>
                <CartesianGrid stroke={CHART.line} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => money(v, true)} tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: any) => money(v)} cursor={{ fill: "#F7F7F5" }} />
                <Bar dataKey="Budget" fill={CHART.line} radius={[3, 3, 0, 0]} />
                <Bar dataKey="Spent" fill={CHART.brand} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-bold">Monthly spend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ left: -10, right: 8 }}>
                <CartesianGrid stroke={CHART.line} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => money(v, true)} tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: any) => money(v)} />
                <Line type="monotone" dataKey="amount" stroke={CHART.ink} strokeWidth={2.5} dot={{ r: 3, fill: CHART.brand, stroke: CHART.brand }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Project progress</h2><Link href="/app/projects" className="text-xs font-semibold text-brand hover:underline">All projects</Link></div>
          <div className="space-y-4">
            {data.projects.filter((p) => p.status !== "Completed").slice(0, 5).map((p) => (
              <Link key={p.id} href={`/app/projects/${p.id}`} className="block rounded-lg p-2 hover:bg-paper">
                <div className="mb-2 flex items-center justify-between gap-3"><span className="truncate text-sm font-semibold">{p.name}</span><div className="flex items-center gap-3"><Badge>{p.status}</Badge><span className="w-10 text-right text-sm font-bold">{p.progress}%</span></div></div>
                <Progress value={p.progress} tone={p.status === "At Risk" ? "bad" : "brand"} />
              </Link>
            ))}
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><AlertTriangle size={17} className="text-brand" />Alerts</h2>
          {alerts.length === 0 ? <p className="text-sm text-muted">No open alerts.</p> : <ul className="space-y-3">{alerts.map((a) => (
            <li key={a.key}><Link href={a.href} className="block rounded-lg border border-line p-3 hover:bg-paper"><p className="text-xs font-semibold uppercase tracking-wide text-muted">{a.type}</p><p className="truncate text-sm font-semibold">{a.title}</p><p className="text-xs text-muted">{a.body}</p></Link></li>))}</ul>}
        </section>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><CalendarClock size={17} className="text-brand" />Upcoming deadlines</h2>
          {m.deadlines.length === 0 ? <p className="text-sm text-muted">Nothing due in the next three weeks.</p> : <ul className="divide-y divide-line">{m.deadlines.map((d) => {
            const n = daysFromToday(d.date)!;
            return <li key={d.id} className="flex items-start justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{d.title}</p><p className="truncate text-xs text-muted">{d.kind} · {d.project}</p></div><span className={`shrink-0 text-xs font-bold ${n < 0 ? "text-bad" : n <= 3 ? "text-[#9a6a12]" : "text-muted"}`}>{n < 0 ? `${-n} d overdue` : n === 0 ? "Today" : fmtDate(d.date)}</span></li>;
          })}</ul>}
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-bold">Recent site activity</h2>
          <ol className="relative space-y-4 border-l border-line pl-5">
            {data.activity_logs.slice(0, 7).map((a) => (
              <li key={a.id} className="relative"><span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand" />
                <p className="text-sm"><span className="font-semibold">{a.action}:</span> {a.entity_name}</p><p className="text-xs text-muted">{a.actor_name} · {timeAgo(a.created_at)}</p></li>
            ))}
            {data.activity_logs.length === 0 && <p className="text-sm text-muted">No activity recorded yet.</p>}
          </ol>
        </section>
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-bold">Recent reports</h2><Link href="/app/reports" className="text-xs font-semibold text-brand hover:underline">All reports</Link></div>
          {data.daily_reports.length === 0 ? <p className="text-sm text-muted">No daily reports yet.</p> : <ul className="divide-y divide-line">{[...data.daily_reports].sort((a, b) => b.report_date.localeCompare(a.report_date)).slice(0, 5).map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{data.projects.find((p) => p.id === r.project_id)?.name || "Project"}</p><p className="text-xs text-muted">{fmtDate(r.report_date)} · {r.supervisor}</p></div><Badge>{r.status}</Badge></li>))}</ul>}
        </section>
      </div>

      <section className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[{ l: "New project", h: "/app/projects?new=1", i: FolderPlus }, { l: "New task", h: "/app/tasks?new=1", i: ListChecks }, { l: "Daily report", h: "/app/reports?new=1", i: ClipboardList }, { l: "Record expense", h: "/app/budget?new=1", i: Receipt }, { l: "Report issue", h: "/app/issues?new=1", i: ShieldAlert }, { l: "View analytics", h: "/app/analytics", i: ArrowRight }].map((a) => (
          <Link key={a.l} href={a.h} className="card flex items-center gap-3 p-4 text-sm font-semibold transition hover:border-brand"><a.i size={18} className="text-brand" />{a.l}</Link>
        ))}
      </section>
    </div>
  );
}
