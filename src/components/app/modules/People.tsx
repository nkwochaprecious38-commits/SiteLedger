"use client";
import { useState } from "react";
import { Eye, Mail, Phone } from "lucide-react";
import { useApp, type Row } from "@/lib/data";
import { CrudModule } from "@/components/app/Crud";
import { Avatar, Badge, Modal } from "@/components/ui";
import { fmtDate, money, timeAgo } from "@/lib/utils";
import { CONTRACTOR_STATUSES, MEMBER_STATUSES, SPECIALTIES, TEAM_ROLES } from "@/lib/constants";

export function TeamModule() {
  const { data } = useApp();
  const [view, setView] = useState<Row | null>(null);
  const projectsOf = (m: Row) => data.projects.filter((p) => (m.project_ids || []).includes(p.id));
  const tasksOf = (m: Row) => data.tasks.filter((t) => t.assignee_id === m.id);
  return (
    <>
      <CrudModule
        table="team_members" noun="Team member" searchKeys={["name", "email", "role"]} exportName="team" defaultSort={{ key: "name", dir: "asc" }}
        fields={[
          { key: "name", label: "Full name", type: "text", required: true },
          { key: "email", label: "Email", type: "email", required: true },
          { key: "role", label: "Role", type: "select", options: TEAM_ROLES, required: true },
          { key: "phone", label: "Phone", type: "tel" },
          { key: "status", label: "Account status", type: "select", options: MEMBER_STATUSES, required: true },
          { key: "project_ids", label: "Assigned projects", type: "projects" },
        ]}
        defaults={{ status: "Active", role: "Site Supervisor", project_ids: [] }}
        filters={[{ key: "role", label: "Role", options: TEAM_ROLES }, { key: "status", label: "Status", options: MEMBER_STATUSES }]}
        columns={[
          { key: "name", label: "Member", render: (r) => <span className="flex items-center gap-3"><Avatar name={r.name} /><span><span className="block font-semibold">{r.name}</span><span className="block text-xs text-muted">{r.email}</span></span></span> },
          { key: "role", label: "Role" },
          { key: "projects", label: "Projects", render: (r) => projectsOf(r).length, sortValue: (r) => projectsOf(r).length, hideMobile: true },
          { key: "tasks", label: "Open tasks", render: (r) => tasksOf(r).filter((t) => t.status !== "Completed").length, sortValue: (r) => tasksOf(r).filter((t) => t.status !== "Completed").length },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
        ]}
        onRowClick={setView}
        rowActions={(r) => <button className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" onClick={() => setView(r)} aria-label="View profile"><Eye size={15} /></button>}
      />
      <Modal open={!!view} onClose={() => setView(null)} title="Team member" wide>
        {view && <div className="space-y-6">
          <div className="flex items-center gap-4"><Avatar name={view.name} size={56} /><div><h3 className="text-lg font-bold">{view.name}</h3><p className="text-sm text-muted">{view.role}</p><div className="mt-1 flex flex-wrap gap-3 text-xs text-muted"><span className="flex items-center gap-1"><Mail size={13} />{view.email || "No email"}</span>{view.phone && <span className="flex items-center gap-1"><Phone size={13} />{view.phone}</span>}</div></div><div className="ml-auto"><Badge>{view.status}</Badge></div></div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><h4 className="label">Assigned projects</h4>{projectsOf(view).length === 0 ? <p className="text-sm text-muted">None</p> : <ul className="space-y-1 text-sm">{projectsOf(view).map((p) => <li key={p.id} className="font-medium">{p.name}</li>)}</ul>}</div>
            <div><h4 className="label">Assigned tasks</h4>{tasksOf(view).length === 0 ? <p className="text-sm text-muted">None</p> : <ul className="space-y-1 text-sm">{tasksOf(view).map((t) => <li key={t.id} className="flex justify-between gap-2"><span className="truncate font-medium">{t.title}</span><Badge>{t.status}</Badge></li>)}</ul>}</div>
          </div>
          <div><h4 className="label">Recent activity</h4>{(() => { const a = data.activity_logs.filter((x) => x.actor_name === view.name).slice(0, 6); return a.length === 0 ? <p className="text-sm text-muted">No recorded activity.</p> : <ul className="space-y-1 text-sm">{a.map((x) => <li key={x.id}>{x.action}: <span className="font-medium">{x.entity_name}</span> <span className="text-muted">{timeAgo(x.created_at)}</span></li>)}</ul>; })()}</div>
        </div>}
      </Modal>
    </>
  );
}

export function ContractorsModule() {
  const { data } = useApp();
  const [view, setView] = useState<Row | null>(null);
  return (
    <>
      <CrudModule
        table="contractors" noun="Contractor" searchKeys={["company_name", "contact_person", "specialty", "email"]} exportName="contractors" defaultSort={{ key: "company_name", dir: "asc" }}
        fields={[
          { key: "company_name", label: "Company name", type: "text", required: true },
          { key: "contact_person", label: "Contact person", type: "text", required: true },
          { key: "email", label: "Email", type: "email" },
          { key: "phone", label: "Phone number", type: "tel" },
          { key: "specialty", label: "Specialty", type: "select", options: SPECIALTIES },
          { key: "status", label: "Status", type: "select", options: CONTRACTOR_STATUSES, required: true },
          { key: "address", label: "Address", type: "text", full: true },
          { key: "project_ids", label: "Associated projects", type: "projects" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        defaults={{ status: "Active", project_ids: [] }}
        filters={[{ key: "specialty", label: "Specialty", options: SPECIALTIES }, { key: "status", label: "Status", options: CONTRACTOR_STATUSES }]}
        columns={[
          { key: "company_name", label: "Company", render: (r) => <div><p className="font-semibold">{r.company_name}</p><p className="text-xs text-muted">{r.contact_person}</p></div> },
          { key: "specialty", label: "Specialty" },
          { key: "phone", label: "Contact", render: (r) => <div className="text-xs"><p>{r.email}</p><p className="text-muted">{r.phone}</p></div>, hideMobile: true },
          { key: "projects", label: "Projects", render: (r) => (r.project_ids || []).length, sortValue: (r) => (r.project_ids || []).length },
          { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
        ]}
        onRowClick={setView}
        rowActions={(r) => <button className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" onClick={() => setView(r)} aria-label="View profile"><Eye size={15} /></button>}
      />
      <Modal open={!!view} onClose={() => setView(null)} title="Contractor profile" wide>
        {view && <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-lg font-bold">{view.company_name}</h3><p className="text-sm text-muted">{view.specialty || "No specialty recorded"}</p></div><Badge>{view.status}</Badge></div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">{[["Contact person", view.contact_person], ["Email", view.email], ["Phone", view.phone], ["Address", view.address]].map(([k, v]) => <div key={k}><dt className="label">{k}</dt><dd className="font-medium">{v || "Not recorded"}</dd></div>)}</dl>
          <div><h4 className="label">Projects</h4>{(() => { const ps = data.projects.filter((p) => (view.project_ids || []).includes(p.id)); return ps.length ? <ul className="space-y-1 text-sm">{ps.map((p) => <li key={p.id} className="font-medium">{p.name} <span className="text-muted">({p.status})</span></li>)}</ul> : <p className="text-sm text-muted">Not associated with any project.</p>; })()}</div>
          <div><h4 className="label">Spend recorded against this contractor</h4><p className="text-sm font-semibold">{money(data.expenses.filter((e) => e.status !== "Rejected" && e.vendor && e.vendor.toLowerCase() === view.company_name.toLowerCase()).reduce((t, e) => t + Number(e.amount), 0))}</p><p className="text-xs text-muted">Expenses whose vendor matches the company name.</p></div>
          <div><h4 className="label">Notes</h4><p className="whitespace-pre-wrap text-sm">{view.notes || "No notes."}</p></div>
          <p className="text-xs text-muted">Added {fmtDate(view.created_at)}</p>
        </div>}
      </Modal>
    </>
  );
}
