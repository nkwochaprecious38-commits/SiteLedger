"use client";
import { useState } from "react";
import { useApp } from "@/lib/data";
import { CrudModule } from "@/components/app/Crud";
import { Badge, Tabs } from "@/components/ui";
import { CommentsBox, PhotoPicker, useNames } from "./shared";
import { daysFromToday, fmtDate, today } from "@/lib/utils";
import { INSPECTION_STATUSES, ISSUE_STATUSES, SEVERITIES } from "@/lib/constants";

export function IssuesModule({ projectId }: { projectId?: string }) {
  const { data } = useApp();
  const names = useNames();
  return (
    <CrudModule
      table="issues" noun="Issue" searchKeys={["title", "description", "corrective_action"]} fixed={projectId ? { project_id: projectId } : undefined}
      exportName="issues" defaultSort={{ key: "severity", dir: "desc" }}
      fields={[
        { key: "title", label: "Issue title", type: "text", required: true, full: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "project_id", label: "Project", type: "project", required: true },
        { key: "severity", label: "Severity", type: "select", options: SEVERITIES, required: true },
        { key: "status", label: "Status", type: "select", options: ISSUE_STATUSES, required: true },
        { key: "assignee_id", label: "Assigned to", type: "member" },
        { key: "due_date", label: "Deadline", type: "date" },
        { key: "corrective_action", label: "Corrective action", type: "textarea" },
        { key: "photos", label: "Photos", type: "text", hidden: true },
      ]}
      defaults={{ severity: "Medium", status: "Open", photos: [] }}
      beforeSave={(v) => ({ ...v, photos: v.photos || [] })}
      formExtra={(v, set) => <><PhotoPicker photos={v.photos || []} onChange={(photos) => set({ photos })} />{v.id ? <CommentsBox entityType="issue" entityId={v.id} /> : null}</>}
      filters={[
        { key: "severity", label: "Severity", options: SEVERITIES }, { key: "status", label: "Status", options: ISSUE_STATUSES },
        { key: "assignee_id", label: "Assignee", options: data.team_members.map((m) => ({ value: m.id, label: m.name })) },
        ...(projectId ? [] : [{ key: "project_id", label: "Project", options: data.projects.map((p) => ({ value: p.id, label: p.name })) }]),
      ]}
      columns={[
        { key: "title", label: "Issue", render: (r) => <div><p className="font-semibold">{r.title}</p>{!projectId && <p className="text-xs text-muted">{names.project(r.project_id)}</p>}</div> },
        { key: "severity", label: "Severity", render: (r) => <Badge>{r.severity}</Badge>, sortValue: (r) => SEVERITIES.indexOf(r.severity) },
        { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
        { key: "assignee_id", label: "Assigned to", render: (r) => names.member(r.assignee_id), hideMobile: true },
        { key: "due_date", label: "Deadline", render: (r) => { const d = daysFromToday(r.due_date); const late = d !== null && d < 0 && ["Open", "In Progress"].includes(r.status); return <span className={late ? "font-semibold text-bad" : ""}>{fmtDate(r.due_date)}{late ? " · overdue" : ""}</span>; } },
      ]}
    />
  );
}

export function InspectionsModule({ projectId }: { projectId?: string }) {
  const { data, profile } = useApp();
  const names = useNames();
  return (
    <CrudModule
      table="inspections" noun="Inspection" searchKeys={["title", "inspector", "findings", "corrective_actions"]} fixed={projectId ? { project_id: projectId } : undefined}
      exportName="inspections" defaultSort={{ key: "inspection_date", dir: "desc" }}
      fields={[
        { key: "title", label: "Inspection title", type: "text", required: true, full: true },
        { key: "project_id", label: "Project", type: "project", required: true },
        { key: "inspection_date", label: "Inspection date", type: "date", required: true },
        { key: "inspector", label: "Inspector", type: "text", required: true },
        { key: "status", label: "Status", type: "select", options: INSPECTION_STATUSES, required: true },
        { key: "findings", label: "Findings", type: "textarea" },
        { key: "corrective_actions", label: "Corrective actions", type: "textarea" },
      ]}
      defaults={{ status: "Scheduled", inspection_date: today(), inspector: profile?.full_name || "" }}
      filters={[{ key: "status", label: "Status", options: INSPECTION_STATUSES }, ...(projectId ? [] : [{ key: "project_id", label: "Project", options: data.projects.map((p) => ({ value: p.id, label: p.name })) }])]}
      columns={[
        { key: "title", label: "Inspection", render: (r) => <div><p className="font-semibold">{r.title}</p>{!projectId && <p className="text-xs text-muted">{names.project(r.project_id)}</p>}</div> },
        { key: "inspection_date", label: "Date", render: (r) => fmtDate(r.inspection_date) },
        { key: "inspector", label: "Inspector", hideMobile: true },
        { key: "findings", label: "Findings", render: (r) => <span className="line-clamp-2 max-w-xs text-xs text-muted">{r.findings || "None recorded"}</span>, hideMobile: true },
        { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
      ]}
    />
  );
}

export function IssuesAndInspections() {
  const [tab, setTab] = useState("Issues");
  return <><Tabs tabs={["Issues", "Inspections"]} value={tab} onChange={setTab} />{tab === "Issues" ? <IssuesModule /> : <InspectionsModule />}</>;
}
