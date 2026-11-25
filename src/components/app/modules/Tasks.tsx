"use client";
import { useState } from "react";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";
import { useApp, type Row } from "@/lib/data";
import { CrudModule } from "@/components/app/Crud";
import { Avatar, Badge } from "@/components/ui";
import { CommentsBox, SegToggle, useNames } from "./shared";
import { daysFromToday, fmtDate } from "@/lib/utils";
import { PRIORITIES, TASK_STATUSES } from "@/lib/constants";

const Due = ({ t }: { t: Row }) => {
  const d = daysFromToday(t.due_date);
  if (d === null) return <span className="text-muted">No due date</span>;
  const done = t.status === "Completed";
  if (!done && d < 0) return <span className="inline-flex items-center gap-1 font-semibold text-bad"><AlertCircle size={13} />{fmtDate(t.due_date)} · {-d}d overdue</span>;
  if (!done && d <= 3) return <span className="font-semibold text-[#9a6a12]">{fmtDate(t.due_date)} · {d === 0 ? "today" : `in ${d}d`}</span>;
  return <span>{fmtDate(t.due_date)}</span>;
};

export function TasksModule({ projectId }: { projectId?: string }) {
  const { data, update, canWrite } = useApp();
  const names = useNames();
  const [layout, setLayout] = useState("List");
  const [drag, setDrag] = useState<string | null>(null);
  const overdue = data.tasks.filter((t) => (!projectId || t.project_id === projectId) && t.status !== "Completed" && (daysFromToday(t.due_date) ?? 0) < 0 && t.due_date).length;

  return (
    <div>
      {overdue > 0 && <div className="mb-4 flex items-center gap-2 rounded-lg border border-bad/30 bg-bad/5 px-4 py-3 text-sm text-bad"><AlertCircle size={16} />{overdue} overdue task{overdue === 1 ? "" : "s"} need attention.</div>}
      <CrudModule
        table="tasks" noun="Task" searchKeys={["title", "description"]} fixed={projectId ? { project_id: projectId } : undefined}
        exportName="tasks" defaultSort={{ key: "due_date", dir: "asc" }}
        viewToggle={<SegToggle options={["List", "Board"]} value={layout} onChange={setLayout} />}
        fields={[
          { key: "title", label: "Task title", type: "text", required: true, full: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "project_id", label: "Project", type: "project", required: true },
          { key: "assignee_id", label: "Assigned to", type: "member" },
          { key: "priority", label: "Priority", type: "select", options: PRIORITIES, required: true },
          { key: "status", label: "Status", type: "select", options: TASK_STATUSES, required: true },
          { key: "due_date", label: "Due date", type: "date" },
        ]}
        defaults={{ priority: "Medium", status: "To Do" }}
        formExtra={(v) => (v.id ? <CommentsBox entityType="task" entityId={v.id} /> : null)}
        filters={[
          { key: "status", label: "Status", options: TASK_STATUSES },
          { key: "priority", label: "Priority", options: PRIORITIES },
          { key: "assignee_id", label: "Assignee", options: data.team_members.map((m) => ({ value: m.id, label: m.name })) },
          ...(projectId ? [] : [{ key: "project_id", label: "Project", options: data.projects.map((p) => ({ value: p.id, label: p.name })) }]),
          { key: "due", label: "Due", options: ["Overdue", "Next 7 days"], match: (r: Row, v: string) => { const d = daysFromToday(r.due_date); if (d === null || r.status === "Completed") return false; return v === "Overdue" ? d < 0 : d >= 0 && d <= 7; } },
        ]}
        columns={[
          { key: "title", label: "Task", render: (r) => <div><p className="font-semibold">{r.title}</p>{!projectId && <p className="text-xs text-muted">{names.project(r.project_id)}</p>}</div> },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
          { key: "priority", label: "Priority", render: (r) => <Badge>{r.priority}</Badge>, sortValue: (r) => PRIORITIES.indexOf(r.priority) },
          { key: "assignee_id", label: "Assignee", render: (r) => <span className="inline-flex items-center gap-2">{r.assignee_id && <Avatar name={names.member(r.assignee_id)} size={24} />}{names.member(r.assignee_id)}</span>, sortValue: (r) => names.member(r.assignee_id) },
          { key: "due_date", label: "Due", render: (r) => <Due t={r} /> },
        ]}
        view={layout === "Board" ? (rows, { edit, del }) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {TASK_STATUSES.map((s) => (
              <div key={s} className={`rounded-xl bg-ink/[0.04] p-3 ${drag ? "ring-1 ring-dashed ring-line" : ""}`}
                onDragOver={(e) => canWrite && e.preventDefault()}
                onDrop={() => { if (drag && canWrite) { update("tasks", drag, { status: s }); setDrag(null); } }}>
                <div className="mb-3 flex items-center justify-between px-1"><h3 className="text-sm font-bold">{s}</h3><span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-muted">{rows.filter((r) => r.status === s).length}</span></div>
                <div className="space-y-3">
                  {rows.filter((r) => r.status === s).map((t) => (
                    <div key={t.id} draggable={canWrite} onDragStart={() => setDrag(t.id)} onDragEnd={() => setDrag(null)} className="card cursor-grab p-3 active:cursor-grabbing">
                      <div className="flex items-start justify-between gap-2"><p className="text-sm font-semibold">{t.title}</p><Badge>{t.priority}</Badge></div>
                      {!projectId && <p className="mt-1 text-xs text-muted">{names.project(t.project_id)}</p>}
                      <div className="mt-3 flex items-center justify-between text-xs"><Due t={t} />{t.assignee_id && <Avatar name={names.member(t.assignee_id)} size={24} />}</div>
                      {canWrite && <div className="mt-3 flex items-center gap-2 border-t border-line pt-2">
                        <select className="input !py-1 text-xs" value={t.status} onChange={(e) => update("tasks", t.id, { status: e.target.value })} aria-label="Move task">{TASK_STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
                        <button className="rounded p-1.5 text-muted hover:bg-line" onClick={() => edit(t)} aria-label="Edit"><Pencil size={14} /></button>
                        <button className="rounded p-1.5 text-muted hover:text-bad" onClick={() => del(t)} aria-label="Delete"><Trash2 size={14} /></button></div>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : undefined}
      />
    </div>
  );
}
