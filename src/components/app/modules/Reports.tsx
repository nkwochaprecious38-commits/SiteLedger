"use client";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useApp } from "@/lib/data";
import { CrudModule } from "@/components/app/Crud";
import { Badge } from "@/components/ui";
import { PhotoPicker, useNames } from "./shared";
import { fmtDate, today } from "@/lib/utils";
import { REPORT_STATUSES, WEATHER } from "@/lib/constants";

export function ReportsModule({ projectId }: { projectId?: string }) {
  const { data, profile } = useApp();
  const names = useNames();
  return (
    <CrudModule
      table="daily_reports" noun="Report" searchKeys={["supervisor", "activities", "issues", "notes", "weather"]}
      fixed={projectId ? { project_id: projectId } : undefined} exportName="daily_reports" defaultSort={{ key: "report_date", dir: "desc" }}
      fields={[
        { key: "project_id", label: "Project", type: "project", required: true },
        { key: "report_date", label: "Report date", type: "date", required: true },
        { key: "supervisor", label: "Site supervisor", type: "text", required: true },
        { key: "weather", label: "Weather conditions", type: "select", options: WEATHER },
        { key: "workforce", label: "Workforce present", type: "number", min: 0 },
        { key: "status", label: "Report status", type: "select", options: REPORT_STATUSES, required: true },
        { key: "activities", label: "Site activities completed", type: "textarea", required: true },
        { key: "equipment", label: "Equipment used", type: "textarea" },
        { key: "materials_delivered", label: "Materials delivered", type: "textarea" },
        { key: "safety", label: "Safety observations", type: "textarea" },
        { key: "issues", label: "Issues encountered", type: "textarea" },
        { key: "delays", label: "Delays", type: "textarea" },
        { key: "notes", label: "Additional notes", type: "textarea" },
        { key: "photos", label: "Photos", type: "text", hidden: true },
      ]}
      defaults={{ report_date: today(), status: "Draft", supervisor: profile?.full_name || "", weather: "Clear", workforce: 0, photos: [] }}
      beforeSave={(v) => ({ ...v, workforce: v.workforce ?? 0, photos: v.photos || [] })}
      formExtra={(v, set) => <PhotoPicker photos={v.photos || []} onChange={(photos) => set({ photos })} />}
      filters={[
        { key: "status", label: "Status", options: REPORT_STATUSES },
        ...(projectId ? [] : [{ key: "project_id", label: "Project", options: data.projects.map((p) => ({ value: p.id, label: p.name })) }]),
        { key: "weather", label: "Weather", options: WEATHER },
      ]}
      columns={[
        { key: "report_date", label: "Date", render: (r) => <span className="font-semibold">{fmtDate(r.report_date)}</span> },
        ...(projectId ? [] : [{ key: "project_id", label: "Project", render: (r: any) => names.project(r.project_id), sortValue: (r: any) => names.project(r.project_id) }]),
        { key: "supervisor", label: "Supervisor" },
        { key: "weather", label: "Weather", hideMobile: true },
        { key: "workforce", label: "Workforce", sortValue: (r) => Number(r.workforce) },
        { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
      ]}
      rowActions={(r) => <Link href={`/app/reports/${r.id}`} className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" aria-label="Preview report"><Eye size={15} /></Link>}
    />
  );
}
