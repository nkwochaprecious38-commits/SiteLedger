"use client";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Receipt, Wand2 } from "lucide-react";
import { useApp, type Row } from "@/lib/data";
import { CrudModule } from "@/components/app/Crud";
import { Badge, Empty, Modal, Progress, Stat } from "@/components/ui";
import { FilePicker, useNames } from "./shared";
import { byCategory, CHART, monthlySpend, monthLabel, spentFor, SERIES } from "@/lib/calc";
import { fmtDate, money, sum, today } from "@/lib/utils";
import { BUDGET_CATEGORIES, EXPENSE_STATUSES } from "@/lib/constants";

const SPLIT = [0.24, 0.3, 0.1, 0.22, 0.03, 0.02, 0.06, 0.03];

export function BudgetModule({ projectId }: { projectId?: string }) {
  const { data, create, update, remove, signedUrl, notify, canWrite } = useApp();
  const names = useNames();
  const [lineProject, setLineProject] = useState(projectId || data.projects[0]?.id || "");
  const [lineModal, setLineModal] = useState<Row | null>(null);
  const [lineAmount, setLineAmount] = useState("");
  const [lineCat, setLineCat] = useState(BUDGET_CATEGORIES[0]);
  const pid = projectId || lineProject;

  const expenses = useMemo(() => data.expenses.filter((e) => !projectId || e.project_id === projectId), [data.expenses, projectId]);
  const projects = data.projects.filter((p) => !projectId || p.id === projectId);
  const totalBudget = sum(projects, "budget");
  const planned = sum(data.budgets.filter((b) => !projectId || b.project_id === projectId), "planned");
  const approved = expenses.filter((e) => e.status === "Approved").reduce((t, e) => t + Number(e.amount), 0);
  const pending = expenses.filter((e) => e.status === "Pending").reduce((t, e) => t + Number(e.amount), 0);
  const actual = approved + pending;

  const catRows = BUDGET_CATEGORIES.map((c) => {
    const p = sum(data.budgets.filter((b) => b.category === c && (!projectId || b.project_id === projectId)), "planned");
    const a = expenses.filter((e) => e.category === c && e.status !== "Rejected").reduce((t, e) => t + Number(e.amount), 0);
    return { category: c, Planned: p, Actual: a, variance: p - a };
  });
  const trend = useMemo(() => {
    let run = 0;
    return monthlySpend(expenses).map((m) => ({ month: m.month, Monthly: m.amount, Cumulative: (run += m.amount) }));
  }, [expenses]);
  const pie = byCategory(expenses);
  const months = [...new Set(expenses.map((e) => e.expense_date.slice(0, 7)))].sort().reverse();

  const lines = data.budgets.filter((b) => b.project_id === pid);
  const generate = async () => {
    const p = data.projects.find((x) => x.id === pid);
    if (!p) return;
    for (let i = 0; i < BUDGET_CATEGORIES.length; i++) {
      if (!lines.find((l) => l.category === BUDGET_CATEGORIES[i])) await create("budgets", { project_id: pid, category: BUDGET_CATEGORIES[i], planned: Math.round(Number(p.budget) * SPLIT[i]) });
    }
    notify("ok", "Budget lines created from the project budget");
  };
  const saveLine = async () => {
    const amt = Number(lineAmount);
    if (isNaN(amt) || amt < 0 || lineAmount === "") { notify("bad", "Enter a planned amount of zero or more"); return; }
    const existing = lines.find((l) => l.category === lineCat && l.id !== lineModal?.id);
    if (existing) { notify("bad", `A budget line for ${lineCat} already exists for this project. Edit that line instead.`); return; }
    const ok = lineModal?.id ? await update("budgets", lineModal.id, { category: lineCat, planned: amt }) : await create("budgets", { project_id: pid, category: lineCat, planned: amt });
    if (ok) { setLineModal(null); notify("ok", "Budget line saved"); }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Project budget" value={money(totalBudget, true)} />
        <Stat label="Planned by category" value={money(planned, true)} hint="Sum of budget lines" />
        <Stat label="Total project cost" value={money(actual, true)} hint={`${money(approved, true)} approved`} />
        <Stat label="Remaining budget" value={money(totalBudget - actual, true)} tone={totalBudget - actual < 0 ? "bad" : "ok"} hint={totalBudget ? `${Math.round((actual / totalBudget) * 100)}% used` : undefined} />
        <Stat label="Pending approval" value={money(pending, true)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5 xl:col-span-2">
          <h2 className="mb-4 font-bold">Planned versus actual by category</h2>
          <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={catRows} margin={{ left: -10 }}><CartesianGrid stroke={CHART.line} vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 10, fill: CHART.muted }} tickLine={false} axisLine={false} interval={0} angle={-20} textAnchor="end" height={55} />
              <YAxis tickFormatter={(v) => money(v, true)} tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v: any) => money(v)} cursor={{ fill: "#F7F7F5" }} /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Planned" fill={CHART.line} radius={[3, 3, 0, 0]} /><Bar dataKey="Actual" fill={CHART.brand} radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </section>
        <section className="card p-5">
          <h2 className="mb-4 font-bold">Spending breakdown</h2>
          {pie.length === 0 ? <p className="py-16 text-center text-sm text-muted">No expenses recorded.</p> : <div className="h-72"><ResponsiveContainer width="100%" height="100%">
            <PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>{pie.map((_, i) => <Cell key={i} fill={SERIES[i % SERIES.length]} />)}</Pie><Tooltip formatter={(v: any) => money(v)} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="card p-5">
          <h2 className="mb-4 font-bold">Cost trend</h2>
          <div className="h-60"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ left: -10, right: 8 }}><CartesianGrid stroke={CHART.line} vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} /><YAxis tickFormatter={(v) => money(v, true)} tick={{ fontSize: 11, fill: CHART.muted }} tickLine={false} axisLine={false} /><Tooltip formatter={(v: any) => money(v)} /><Line dataKey="Cumulative" stroke={CHART.ink} strokeWidth={2.5} dot={false} /><Line dataKey="Monthly" stroke={CHART.brand} strokeWidth={2} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div>
        </section>
        <section className="card overflow-hidden xl:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5">
            <div><h2 className="font-bold">Budget lines and cost variance</h2><p className="text-xs text-muted">Positive variance means under budget.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              {!projectId && <select className="input w-auto" value={lineProject} onChange={(e) => setLineProject(e.target.value)} aria-label="Project">{data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>}
              {canWrite && pid && <><button className="btn-outline btn-sm" onClick={generate}><Wand2 size={14} />Generate from budget</button><button className="btn-dark btn-sm" onClick={() => { setLineModal({}); setLineAmount(""); setLineCat(BUDGET_CATEGORIES.find((c) => !lines.find((l) => l.category === c)) || BUDGET_CATEGORIES[0]); }}>Add line</button></>}
            </div>
          </div>
          {!pid ? <Empty title="Create a project first" /> : lines.length === 0 ? <Empty title="No budget lines for this project" text="Add categories manually or generate a standard split from the project budget." /> : (
            <div className="overflow-x-auto"><table className="w-full"><thead className="bg-paper"><tr><th className="th">Category</th><th className="th">Planned</th><th className="th">Actual</th><th className="th">Variance</th><th className="th w-40">Used</th><th className="th" /></tr></thead>
              <tbody className="divide-y divide-line">{lines.map((l) => {
                const a = data.expenses.filter((e) => e.project_id === pid && e.category === l.category && e.status !== "Rejected").reduce((t, e) => t + Number(e.amount), 0);
                const pct = Number(l.planned) ? (a / Number(l.planned)) * 100 : a ? 100 : 0;
                return <tr key={l.id}><td className="td font-semibold">{l.category}</td><td className="td">{money(l.planned)}</td><td className="td">{money(a)}</td><td className={`td font-semibold ${l.planned - a < 0 ? "text-bad" : "text-ok"}`}>{money(l.planned - a)}</td><td className="td"><Progress value={pct} tone={pct > 100 ? "bad" : pct > 85 ? "warn" : "brand"} /></td>
                  <td className="td text-right">{canWrite && <><button className="btn-ghost btn-sm" onClick={() => { setLineModal(l); setLineAmount(String(l.planned)); setLineCat(l.category); }}>Edit</button><button className="btn-ghost btn-sm text-bad" onClick={async () => { if (confirm(`Delete the ${l.category} budget line?`)) await remove("budgets", l.id); }}>Delete</button></>}</td></tr>;
              })}</tbody></table></div>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Expenses</h2>
        <CrudModule
          table="expenses" noun="Expense" searchKeys={["description", "vendor", "category"]} rows={expenses}
          fixed={projectId ? { project_id: projectId } : undefined} exportName="expenses" defaultSort={{ key: "expense_date", dir: "desc" }}
          fields={[
            { key: "project_id", label: "Project", type: "project", required: true },
            { key: "category", label: "Category", type: "select", options: BUDGET_CATEGORIES, required: true },
            { key: "description", label: "Description", type: "text", required: true, full: true },
            { key: "vendor", label: "Vendor or payee", type: "text" },
            { key: "amount", label: "Amount (USD)", type: "number", min: 0, required: true },
            { key: "expense_date", label: "Date", type: "date", required: true },
            { key: "status", label: "Status", type: "select", options: EXPENSE_STATUSES, required: true },
            { key: "receipt_path", label: "Receipt", type: "text", hidden: true },
          ]}
          defaults={{ category: "Materials", status: "Pending", expense_date: today() }}
          formExtra={(v, set) => <FilePicker label="Receipt (optional)" accept="image/*,application/pdf" current={v.receipt_path} onUploaded={(p) => set({ receipt_path: p })} />}
          filters={[
            { key: "status", label: "Status", options: EXPENSE_STATUSES }, { key: "category", label: "Category", options: BUDGET_CATEGORIES },
            ...(projectId ? [] : [{ key: "project_id", label: "Project", options: data.projects.map((p) => ({ value: p.id, label: p.name })) }]),
            { key: "month", label: "Month", options: months.map((m) => ({ value: m, label: monthLabel(m) })), match: (r: Row, v: string) => r.expense_date.startsWith(v) },
          ]}
          columns={[
            { key: "expense_date", label: "Date", render: (r) => fmtDate(r.expense_date) },
            { key: "description", label: "Description", render: (r) => <div><p className="font-semibold">{r.description}</p>{!projectId && <p className="text-xs text-muted">{names.project(r.project_id)}</p>}</div> },
            { key: "category", label: "Category", hideMobile: true },
            { key: "vendor", label: "Vendor", hideMobile: true },
            { key: "amount", label: "Amount", render: (r) => <span className="font-semibold">{money(r.amount)}</span>, sortValue: (r) => Number(r.amount) },
            { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
          ]}
          rowActions={(r) => r.receipt_path ? <button className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" aria-label="View receipt" onClick={async () => { const u = await signedUrl(r.receipt_path); if (u) window.open(u, "_blank"); }}><Receipt size={15} /></button> : null}
        />
      </section>

      <Modal open={!!lineModal} onClose={() => setLineModal(null)} title={lineModal?.id ? "Edit budget line" : "Add budget line"} footer={<><button className="btn-outline" onClick={() => setLineModal(null)}>Cancel</button><button className="btn-primary" onClick={saveLine}>Save budget line</button></>}>
        <div className="space-y-4"><div><label className="label">Category</label><select className="input" value={lineCat} onChange={(e) => setLineCat(e.target.value)}>{BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label">Planned amount (USD)</label><input className="input" type="number" min={0} value={lineAmount} onChange={(e) => setLineAmount(e.target.value)} /></div></div>
      </Modal>
    </div>
  );
}
