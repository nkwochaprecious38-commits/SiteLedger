"use client";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Printer } from "lucide-react";
import { useApp } from "@/lib/data";
import { Empty, PageHeader, Stat } from "@/components/ui";
import { BUDGET_CATEGORIES } from "@/lib/constants";
import { byCategory, CHART, monthlySpend, SERIES, spentFor } from "@/lib/calc";
import { daysFromToday, downloadCSV, money, sum } from "@/lib/utils";

const Card = ({ title, children, onCsv }: { title: string; children: React.ReactNode; onCsv?: () => void }) => (
  <section className="card p-5"><div className="mb-4 flex items-start justify-between gap-3"><h2 className="font-bold">{title}</h2>{onCsv && <button className="no-print text-xs font-semibold text-brand hover:underline" onClick={onCsv}>CSV</button>}</div>{children}</section>
);
const axis = { tick: { fontSize: 11, fill: CHART.muted }, tickLine: false, axisLine: false } as const;

export default function Analytics() {
  const { data } = useApp();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [project, setProject] = useState("");
  const [category, setCategory] = useState("");

  const inRange = (d?: string | null) => !d || ((!from || d >= from) && (!to || d <= to));
  const f = useMemo(() => {
    const byP = (r: any) => !project || r.project_id === project;
    return {
      projects: data.projects.filter((p) => !project || p.id === project),
      expenses: data.expenses.filter((e) => byP(e) && inRange(e.expense_date) && (!category || e.category === category)),
      tasks: data.tasks.filter((t) => byP(t) && inRange(t.due_date)),
      reports: data.daily_reports.filter((r) => byP(r) && inRange(r.report_date)),
      records: data.inventory_records.filter((r) => byP(r) && inRange(r.record_date)),
      activity: data.activity_logs.filter((a) => (!project || a.project_id === project) && inRange(a.created_at.slice(0, 10))),
      issues: data.issues.filter(byP),
      milestones: data.milestones.filter(byP),
    };
  }, [data, from, to, project, category]);

  if (!data.projects.length) return <div><PageHeader title="Analytics and Reports" /><div className="card"><Empty title="No data to analyze yet" text="Analytics are calculated from your projects, tasks, expenses and reports. Add records or load sample data from the Overview page." /></div></div>;

  const completion = f.projects.map((p) => ({ name: p.name.length > 16 ? p.name.slice(0, 15) + "…" : p.name, Progress: p.progress }));
  const budgetPerf = f.projects.map((p) => ({ name: p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name, Budget: Number(p.budget), Actual: f.expenses.filter((e) => e.project_id === p.id && e.status !== "Rejected").reduce((t, e) => t + Number(e.amount), 0) }));
  const trend = monthlySpend(f.expenses);
  const taskStatus = ["To Do", "In Progress", "Under Review", "Completed"].map((s) => ({ name: s, value: f.tasks.filter((t) => t.status === s).length }));
  const completionRate = f.tasks.length ? Math.round((f.tasks.filter((t) => t.status === "Completed").length / f.tasks.length) * 100) : 0;
  const delays = f.projects.map((p) => ({
    project: p.name, status: p.status,
    overdue_tasks: f.tasks.filter((t) => t.project_id === p.id && t.status !== "Completed" && (daysFromToday(t.due_date) ?? 0) < 0 && t.due_date).length,
    overdue_milestones: f.milestones.filter((m) => m.project_id === p.id && !m.completed && (daysFromToday(m.due_date) ?? 0) < 0 && m.due_date).length,
    days_past_end_date: p.status === "Completed" ? 0 : Math.max(0, -(daysFromToday(p.end_date) ?? 0)),
  }));
  const consumption = data.materials.filter((m) => !project || m.project_id === project).map((m) => ({ name: m.name.length > 16 ? m.name.slice(0, 15) + "…" : m.name, Used: sum(f.records.filter((r) => r.material_id === m.id && r.kind === "usage"), "quantity"), Delivered: sum(f.records.filter((r) => r.material_id === m.id && r.kind === "delivery"), "quantity") })).filter((m) => m.Used || m.Delivered);
  const activityBy = f.projects.map((p) => ({ name: p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name, Events: f.activity.filter((a) => a.project_id === p.id).length }));
  const workload = data.team_members.map((m) => ({ name: m.name.split(" ")[0], Open: f.tasks.filter((t) => t.assignee_id === m.id && t.status !== "Completed").length, Completed: f.tasks.filter((t) => t.assignee_id === m.id && t.status === "Completed").length })).filter((m) => m.Open || m.Completed);
  const contractors = data.contractors.map((c) => ({ contractor: c.company_name, specialty: c.specialty, status: c.status, projects: (c.project_ids || []).length, spend: f.expenses.filter((e) => e.status !== "Rejected" && e.vendor?.toLowerCase() === c.company_name.toLowerCase()).reduce((t, e) => t + Number(e.amount), 0), open_issues_on_projects: f.issues.filter((i) => (c.project_ids || []).includes(i.project_id) && ["Open", "In Progress"].includes(i.status)).length }));
  const reportSummary = ["Draft", "Submitted", "Approved"].map((s) => ({ status: s, reports: f.reports.filter((r) => r.status === s).length, avg_workforce: Math.round(sum(f.reports.filter((r) => r.status === s), "workforce") / Math.max(1, f.reports.filter((r) => r.status === s).length)) }));
  const totalSpent = f.expenses.filter((e) => e.status !== "Rejected").reduce((t, e) => t + Number(e.amount), 0);

  return (
    <div className="print-area">
      <PageHeader title="Analytics and Reports" subtitle="Insights calculated from your live project, cost, task and site data."
        actions={<div className="no-print flex gap-2"><button className="btn-outline" onClick={() => downloadCSV("budget_performance.csv", budgetPerf)}><Download size={16} />Export CSV</button><button className="btn-dark" onClick={() => window.print()}><Printer size={16} />Export PDF</button></div>} />
      <div className="no-print card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div><label className="label">From</label><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label className="label">To</label><input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div><label className="label">Project</label><select className="input" value={project} onChange={(e) => setProject(e.target.value)}><option value="">All projects</option>{data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <div><label className="label">Expense category</label><select className="input" value={category} onChange={(e) => setCategory(e.target.value)}><option value="">All categories</option>{BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="flex items-end"><button className="btn-outline w-full" onClick={() => { setFrom(""); setTo(""); setProject(""); setCategory(""); }}>Reset filters</button></div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Projects in view" value={f.projects.length} /><Stat label="Spend in view" value={money(totalSpent, true)} /><Stat label="Task completion rate" value={`${completionRate}%`} hint={`${f.tasks.length} tasks`} /><Stat label="Daily reports" value={f.reports.length} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Project completion" onCsv={() => downloadCSV("project_completion.csv", completion)}><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={completion} layout="vertical" margin={{ left: 10 }}><CartesianGrid stroke={CHART.line} horizontal={false} /><XAxis type="number" domain={[0, 100]} {...axis} /><YAxis type="category" dataKey="name" width={110} {...axis} /><Tooltip /><Bar dataKey="Progress" fill={CHART.brand} radius={[0, 3, 3, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Budget performance" onCsv={() => downloadCSV("budget_performance.csv", budgetPerf)}><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={budgetPerf} margin={{ left: -10 }}><CartesianGrid stroke={CHART.line} vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis tickFormatter={(v) => money(v, true)} {...axis} /><Tooltip formatter={(v: any) => money(v)} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="Budget" fill={CHART.line} radius={[3, 3, 0, 0]} /><Bar dataKey="Actual" fill={CHART.ink} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Expense trends" onCsv={() => downloadCSV("expense_trend.csv", trend)}><div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ left: -10, right: 8 }}><CartesianGrid stroke={CHART.line} vertical={false} /><XAxis dataKey="month" {...axis} /><YAxis tickFormatter={(v) => money(v, true)} {...axis} /><Tooltip formatter={(v: any) => money(v)} /><Line dataKey="amount" stroke={CHART.brand} strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></Card>
        <Card title="Spend by category" onCsv={() => downloadCSV("spend_by_category.csv", byCategory(f.expenses))}><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={byCategory(f.expenses)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={2}>{byCategory(f.expenses).map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}</Pie><Tooltip formatter={(v: any) => money(v)} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Card>
        <Card title="Task completion by status" onCsv={() => downloadCSV("task_status.csv", taskStatus)}><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={taskStatus}><CartesianGrid stroke={CHART.line} vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis allowDecimals={false} {...axis} /><Tooltip /><Bar dataKey="value" name="Tasks" fill={CHART.ink} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Team workload" onCsv={() => downloadCSV("team_workload.csv", workload)}>{workload.length === 0 ? <p className="py-20 text-center text-sm text-muted">No assigned tasks in this view.</p> : <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={workload}><CartesianGrid stroke={CHART.line} vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis allowDecimals={false} {...axis} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="Open" stackId="a" fill={CHART.brand} /><Bar dataKey="Completed" stackId="a" fill={CHART.line} /></BarChart></ResponsiveContainer></div>}</Card>
        <Card title="Material consumption" onCsv={() => downloadCSV("material_consumption.csv", consumption)}>{consumption.length === 0 ? <p className="py-20 text-center text-sm text-muted">No inventory movements recorded in this view.</p> : <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={consumption}><CartesianGrid stroke={CHART.line} vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="Delivered" fill={CHART.line} /><Bar dataKey="Used" fill={CHART.brand} /></BarChart></ResponsiveContainer></div>}</Card>
        <Card title="Project activity" onCsv={() => downloadCSV("project_activity.csv", activityBy)}><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={activityBy}><CartesianGrid stroke={CHART.line} vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis allowDecimals={false} {...axis} /><Tooltip /><Bar dataKey="Events" fill={CHART.ink} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card title="Project delays" onCsv={() => downloadCSV("project_delays.csv", delays)}><Table head={["Project", "Overdue tasks", "Overdue milestones", "Days past end"]} rows={delays.map((d) => [d.project, d.overdue_tasks, d.overdue_milestones, d.days_past_end_date])} /></Card>
        <Card title="Daily report summary" onCsv={() => downloadCSV("report_summary.csv", reportSummary)}><Table head={["Status", "Reports", "Average workforce"]} rows={reportSummary.map((r) => [r.status, r.reports, r.avg_workforce])} /></Card>
        <Card title="Contractor performance" onCsv={() => downloadCSV("contractors.csv", contractors)}>{contractors.length === 0 ? <p className="text-sm text-muted">Add contractors and tag expenses with their company name as vendor to see performance indicators.</p> : <Table head={["Contractor", "Projects", "Spend", "Open issues"]} rows={contractors.map((c) => [c.contractor, c.projects, money(c.spend), c.open_issues_on_projects])} />}</Card>
      </div>
    </div>
  );
}

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{head.map((h) => <th key={h} className="th px-2">{h}</th>)}</tr></thead><tbody className="divide-y divide-line">{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} className={`px-2 py-2.5 ${j === 0 ? "font-semibold" : ""}`}>{c}</td>)}</tr>)}</tbody></table></div>;
}
