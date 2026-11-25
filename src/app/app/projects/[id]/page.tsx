"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, MapPin, Pencil, Plus, Trash2, UserPlus, X } from "lucide-react";
import { useApp } from "@/lib/data";
import { Avatar, Badge, Confirm, Empty, Field, Modal, Progress, Stat, Tabs } from "@/components/ui";
import { FieldInput } from "@/components/app/Crud";
import { PROJECT_FIELDS, ProjectArt } from "@/components/app/modules/Projects";
import { TasksModule } from "@/components/app/modules/Tasks";
import { ReportsModule } from "@/components/app/modules/Reports";
import { DocumentsModule } from "@/components/app/modules/Documents";
import { BudgetModule } from "@/components/app/modules/Budget";
import { MaterialsModule } from "@/components/app/modules/Materials";
import { IssuesModule, InspectionsModule } from "@/components/app/modules/Issues";
import { daysFromToday, fmtDate, money, timeAgo } from "@/lib/utils";
import { spentFor } from "@/lib/calc";

const TABS = ["Overview", "Tasks", "Daily Reports", "Documents", "Budget", "Materials", "Team", "Issues", "Activity"];

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, update, remove, create, canWrite, notify, loading } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState("Overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<any>({});
  const [del, setDel] = useState(false);
  const [msTitle, setMsTitle] = useState("");
  const [msDate, setMsDate] = useState("");
  const [addMember, setAddMember] = useState("");
  const p = data.projects.find((x) => x.id === id);

  if (!p) return <div className="card">{loading ? <Empty title="Loading project" /> : <Empty title="Project not found" text="It may have been deleted." action={<Link href="/app/projects" className="btn-dark">Back to projects</Link>} />}</div>;

  const spent = spentFor(data.expenses, id);
  const manager = data.team_members.find((m) => m.id === p.manager_id);
  const members = data.team_members.filter((m) => (m.project_ids || []).includes(id));
  const milestones = data.milestones.filter((m) => m.project_id === id).sort((a, b) => (a.due_date || "").localeCompare(b.due_date || ""));
  const tasks = data.tasks.filter((t) => t.project_id === id);
  const open = tasks.filter((t) => t.status !== "Completed");
  const deadlines = [...open.filter((t) => t.due_date).map((t) => ({ k: "t" + t.id, title: t.title, date: t.due_date, kind: "Task" })), ...milestones.filter((m) => !m.completed && m.due_date).map((m) => ({ k: "m" + m.id, title: m.title, date: m.due_date, kind: "Milestone" }))].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6);
  const activity = data.activity_logs.filter((a) => a.project_id === id);
  const pct = Number(p.budget) ? (spent / Number(p.budget)) * 100 : 0;
  const daysLeft = daysFromToday(p.end_date);

  const startEdit = () => { setForm({ ...p }); setEditing(true); };
  const save = async () => {
    if (!form.name?.trim()) { notify("bad", "Project name is required"); return; }
    if (form.start_date && form.end_date && form.end_date < form.start_date) { notify("bad", "Expected completion must be after the start date"); return; }
    const patch: any = {};
    PROJECT_FIELDS.forEach((f) => { let v = form[f.key]; if (f.type === "number") v = v === "" || v == null ? 0 : Number(v); else if (v === "") v = null; patch[f.key] = v; });
    if (patch.progress > 100) { notify("bad", "Percent complete cannot exceed 100"); return; }
    if (await update("projects", id, patch)) { notify("ok", "Project updated"); setEditing(false); }
  };

  return (
    <div>
      <Link href="/app/projects" className="no-print mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink"><ArrowLeft size={15} />All projects</Link>
      <div className="card mb-6 overflow-hidden">
        <div className="relative h-36 sm:h-44"><ProjectArt category={p.category} className="h-full w-full" /><div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3 text-white"><div><div className="mb-2 flex gap-2"><span className="rounded-full bg-white"><Badge>{p.status}</Badge></span><Badge tone="dark">{p.category}</Badge></div><h1 className="text-2xl font-extrabold sm:text-3xl">{p.name}</h1><p className="mt-1 flex items-center gap-1.5 text-sm text-white/80"><MapPin size={14} />{p.location || "No location"}{p.client ? ` · ${p.client}` : ""}</p></div>
            {canWrite && <div className="flex gap-2"><button className="btn-outline" onClick={startEdit}><Pencil size={15} />Edit</button><button className="btn bg-white/10 text-white hover:bg-bad" onClick={() => setDel(true)}><Trash2 size={15} />Delete</button></div>}</div></div>
      </div>
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      {tab === "Overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Progress" value={`${p.progress}%`} hint={daysLeft === null ? undefined : daysLeft < 0 && p.status !== "Completed" ? `${-daysLeft} days past due date` : `${Math.max(daysLeft, 0)} days to completion date`} />
            <Stat label="Budget" value={money(p.budget, true)} /><Stat label="Spent" value={money(spent, true)} hint={`${Math.round(pct)}% of budget`} tone={pct > 100 ? "bad" : undefined} />
            <Stat label="Remaining" value={money(Number(p.budget) - spent, true)} tone={Number(p.budget) - spent < 0 ? "bad" : "ok"} />
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card p-5 lg:col-span-2 space-y-5">
              <div><h2 className="mb-3 font-bold">Progress and budget</h2><div className="space-y-4">
                <div><div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">Work completed</span><span className="font-bold">{p.progress}%</span></div><Progress value={p.progress} tone={p.status === "At Risk" ? "bad" : "brand"} /></div>
                <div><div className="mb-1.5 flex justify-between text-sm"><span className="text-muted">Budget used</span><span className="font-bold">{Math.round(pct)}%</span></div><Progress value={pct} tone={pct > 100 ? "bad" : pct > 85 ? "warn" : "ok"} /></div></div></div>
              <div><h2 className="mb-2 font-bold">About this project</h2><p className="text-sm text-muted">{p.description || "No description provided."}</p>
                <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">{[["Project manager", manager?.name || "Unassigned"], ["Start date", fmtDate(p.start_date)], ["Expected completion", fmtDate(p.end_date)], ["Client", p.client || "Not set"], ["Open tasks", String(open.length)], ["Documents", String(data.documents.filter((d) => d.project_id === id).length)]].map(([k, v]) => <div key={k}><dt className="label">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl></div>
            </section>
            <section className="card p-5"><h2 className="mb-3 font-bold">Upcoming deadlines</h2>{deadlines.length === 0 ? <p className="text-sm text-muted">Nothing scheduled.</p> : <ul className="divide-y divide-line">{deadlines.map((d) => { const n = daysFromToday(d.date)!; return <li key={d.k} className="flex justify-between gap-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm font-semibold">{d.title}</p><p className="text-xs text-muted">{d.kind}</p></div><span className={`shrink-0 text-xs font-bold ${n < 0 ? "text-bad" : "text-muted"}`}>{n < 0 ? `${-n}d overdue` : fmtDate(d.date)}</span></li>; })}</ul>}</section>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            <section className="card p-5 lg:col-span-2">
              <h2 className="mb-3 font-bold">Milestones</h2>
              <ul className="divide-y divide-line">
                {milestones.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 py-2.5">
                    <button disabled={!canWrite} onClick={() => update("milestones", m.id, { completed: !m.completed })} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${m.completed ? "border-ok bg-ok text-white" : "border-line"}`} aria-label="Toggle milestone">{m.completed && <Check size={14} />}</button>
                    <div className="min-w-0 flex-1"><p className={`truncate text-sm font-semibold ${m.completed ? "text-muted line-through" : ""}`}>{m.title}</p><p className="text-xs text-muted">{fmtDate(m.due_date)}</p></div>
                    {canWrite && <button className="rounded p-1.5 text-muted hover:text-bad" onClick={() => remove("milestones", m.id)} aria-label="Delete milestone"><X size={15} /></button>}
                  </li>
                ))}
                {milestones.length === 0 && <li className="py-3 text-sm text-muted">No milestones yet.</li>}
              </ul>
              {canWrite && <form className="mt-4 flex flex-col gap-2 sm:flex-row" onSubmit={async (e) => { e.preventDefault(); if (!msTitle.trim()) return; if (await create("milestones", { project_id: id, title: msTitle.trim(), due_date: msDate || null, completed: false })) { setMsTitle(""); setMsDate(""); } }}>
                <input className="input" placeholder="New milestone" value={msTitle} onChange={(e) => setMsTitle(e.target.value)} /><input className="input sm:w-44" type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} /><button className="btn-dark"><Plus size={15} />Add</button></form>}
            </section>
            <section className="card p-5"><h2 className="mb-3 font-bold">Team</h2>{members.length === 0 ? <p className="text-sm text-muted">No members assigned.</p> : <ul className="space-y-3">{members.slice(0, 6).map((m) => <li key={m.id} className="flex items-center gap-3"><Avatar name={m.name} /><div className="min-w-0"><p className="truncate text-sm font-semibold">{m.name}</p><p className="text-xs text-muted">{m.role}</p></div></li>)}</ul>}
              <h2 className="mb-3 mt-6 font-bold">Recent activity</h2>{activity.length === 0 ? <p className="text-sm text-muted">No activity yet.</p> : <ul className="space-y-2 text-sm">{activity.slice(0, 4).map((a) => <li key={a.id}><span className="font-semibold">{a.action}:</span> {a.entity_name}<span className="block text-xs text-muted">{a.actor_name} · {timeAgo(a.created_at)}</span></li>)}</ul>}</section>
          </div>
        </div>
      )}
      {tab === "Tasks" && <TasksModule projectId={id} />}
      {tab === "Daily Reports" && <ReportsModule projectId={id} />}
      {tab === "Documents" && <DocumentsModule projectId={id} />}
      {tab === "Budget" && <BudgetModule projectId={id} />}
      {tab === "Materials" && <MaterialsModule projectId={id} />}
      {tab === "Team" && (
        <div className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-5"><h2 className="font-bold">Project team ({members.length})</h2>
            {canWrite && <div className="flex gap-2"><select className="input w-auto" value={addMember} onChange={(e) => setAddMember(e.target.value)} aria-label="Add team member"><option value="">Select member</option>{data.team_members.filter((m) => !(m.project_ids || []).includes(id)).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
              <button className="btn-dark" disabled={!addMember} onClick={async () => { const m = data.team_members.find((x) => x.id === addMember)!; if (await update("team_members", m.id, { project_ids: [...(m.project_ids || []), id] })) setAddMember(""); }}><UserPlus size={15} />Assign</button></div>}</div>
          {members.length === 0 ? <Empty title="No team members assigned" text="Assign people from your team directory to this project." /> : <ul className="divide-y divide-line">{members.map((m) => <li key={m.id} className="flex items-center gap-3 p-4"><Avatar name={m.name} size={38} /><div className="min-w-0 flex-1"><p className="font-semibold">{m.name}{m.id === p.manager_id && <span className="ml-2 text-xs text-brand">Project manager</span>}</p><p className="text-xs text-muted">{m.role} · {data.tasks.filter((t) => t.assignee_id === m.id && t.project_id === id && t.status !== "Completed").length} open tasks</p></div><Badge>{m.status}</Badge>{canWrite && <button className="btn-ghost btn-sm text-bad" onClick={() => update("team_members", m.id, { project_ids: (m.project_ids || []).filter((x: string) => x !== id) })}>Remove</button>}</li>)}</ul>}
        </div>
      )}
      {tab === "Issues" && <div className="space-y-8"><IssuesModule projectId={id} /><div><h2 className="mb-3 text-lg font-bold">Inspections</h2><InspectionsModule projectId={id} /></div></div>}
      {tab === "Activity" && <div className="card p-6">{activity.length === 0 ? <Empty title="No activity recorded" text="Changes to tasks, reports, expenses and documents appear here." /> : <ol className="relative space-y-5 border-l border-line pl-6">{activity.map((a) => <li key={a.id} className="relative"><span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand" /><p className="text-sm"><span className="font-semibold">{a.action}:</span> {a.entity_name}</p><p className="text-xs text-muted">{a.actor_name} · {timeAgo(a.created_at)}</p></li>)}</ol>}</div>}

      <Modal open={editing} onClose={() => setEditing(false)} title="Edit project" wide footer={<><button className="btn-outline" onClick={() => setEditing(false)}>Cancel</button><button className="btn-primary" onClick={save}>Save changes</button></>}>
        <div className="grid gap-4 sm:grid-cols-2">{PROJECT_FIELDS.map((f) => <div key={f.key} className={f.full || f.type === "textarea" ? "sm:col-span-2" : ""}><Field label={f.label}><FieldInput f={f} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} /></Field></div>)}</div>
      </Modal>
      <Confirm open={del} title="Delete project" message={`Deleting "${p.name}" permanently removes its tasks, reports, budgets, expenses, issues and inspections. Documents and materials remain but lose their project link. This cannot be undone.`} onConfirm={async () => { if (await remove("projects", id)) { notify("ok", "Project deleted"); router.push("/app/projects"); } }} onCancel={() => setDel(false)} />
    </div>
  );
}
