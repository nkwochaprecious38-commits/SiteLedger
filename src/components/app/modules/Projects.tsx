"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MapPin, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { useApp } from "@/lib/data";
import { CrudModule, type FieldDef } from "@/components/app/Crud";
import { Badge, Progress } from "@/components/ui";
import { SegToggle, useNames } from "./shared";
import { fmtDate, money } from "@/lib/utils";
import { spentFor } from "@/lib/calc";
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from "@/lib/constants";

export const PROJECT_FIELDS: FieldDef[] = [
        { key: "name", label: "Project name", type: "text", required: true, full: true },
        { key: "description", label: "Description", type: "textarea" },
        { key: "location", label: "Location", type: "text" },
        { key: "client", label: "Client name", type: "text" },
        { key: "manager_id", label: "Project manager", type: "member" },
        { key: "category", label: "Category", type: "select", options: PROJECT_CATEGORIES, required: true },
        { key: "status", label: "Status", type: "select", options: PROJECT_STATUSES, required: true },
        { key: "budget", label: "Budget (USD)", type: "number", min: 0, required: true },
        { key: "start_date", label: "Start date", type: "date" },
        { key: "end_date", label: "Expected completion", type: "date" },
        { key: "progress", label: "Percent complete", type: "number", min: 0 },
      ];

export function ProjectArt({ category, className = "" }: { category: string; className?: string }) {
  const tall = ["Commercial", "Mixed Use"].includes(category);
  return (
    <svg viewBox="0 0 320 140" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="320" height="140" fill="#252B30" />
      <g stroke="#ffffff" strokeOpacity="0.07">{[...Array(9)].map((_, i) => <line key={i} x1={i * 40} y1="0" x2={i * 40} y2="140" />)}{[...Array(5)].map((_, i) => <line key={i} x1="0" y1={i * 35} x2="320" y2={i * 35} />)}</g>
      {tall ? <><rect x="90" y="24" width="70" height="100" fill="#171A1D" stroke="#fff" strokeOpacity=".4" /><rect x="160" y="52" width="60" height="72" fill="#F36B32" /><g stroke="#fff" strokeOpacity=".25">{[40, 56, 72, 88, 104].map((y) => <line key={y} x1="90" x2="160" y1={y} y2={y} />)}</g></>
        : <><rect x="60" y="68" width="110" height="56" fill="#171A1D" stroke="#fff" strokeOpacity=".4" /><rect x="170" y="48" width="86" height="76" fill="#F36B32" /><path d="M60 68 L115 40 L170 68" fill="none" stroke="#fff" strokeOpacity=".4" /></>}
      <line x1="0" y1="124" x2="320" y2="124" stroke="#fff" strokeOpacity=".5" />
      <path d="M250 124 V20 H290 M250 20 L236 36" stroke="#E6A23C" strokeWidth="3" fill="none" />
    </svg>
  );
}

export function ProjectsModule() {
  const { data, canWrite } = useApp();
  const router = useRouter();
  const names = useNames();
  const [layout, setLayout] = useState("Cards");
  const locations = [...new Set(data.projects.map((p) => p.location).filter(Boolean))] as string[];

  return (
    <CrudModule
      table="projects" noun="Project" searchKeys={["name", "client", "location", "description"]}
      exportName="projects" defaultSort={{ key: "name", dir: "asc" }}
      onRowClick={(r) => router.push(`/app/projects/${r.id}`)}
      viewToggle={<SegToggle options={["Cards", "Table"]} value={layout} onChange={setLayout} />}
      fields={PROJECT_FIELDS}
      validate={(v) => (v.start_date && v.end_date && v.end_date < v.start_date ? "Expected completion must be after the start date." : Number(v.progress) > 100 ? "Percent complete cannot exceed 100." : null)}
      beforeSave={(v) => ({ ...v, progress: v.progress ?? 0, budget: v.budget ?? 0 })}
      defaults={{ status: "Planning", category: "Commercial", progress: 0 }}
      filters={[
        { key: "status", label: "Status", options: PROJECT_STATUSES },
        { key: "category", label: "Category", options: PROJECT_CATEGORIES },
        { key: "location", label: "Location", options: locations },
        { key: "manager_id", label: "Manager", options: data.team_members.map((m) => ({ value: m.id, label: m.name })) },
      ]}
      columns={[
        { key: "name", label: "Project", render: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted">{r.client}</p></div> },
        { key: "status", label: "Status", render: (r) => <Badge>{r.status}</Badge> },
        { key: "location", label: "Location", hideMobile: true },
        { key: "manager_id", label: "Manager", render: (r) => names.member(r.manager_id), sortValue: (r) => names.member(r.manager_id) },
        { key: "budget", label: "Budget", render: (r) => money(r.budget), sortValue: (r) => Number(r.budget) },
        { key: "spent", label: "Spent", render: (r) => money(spentFor(data.expenses, r.id)), sortValue: (r) => spentFor(data.expenses, r.id) },
        { key: "progress", label: "Progress", render: (r) => <div className="flex min-w-[7rem] items-center gap-2"><Progress value={r.progress} /><span className="text-xs font-bold">{r.progress}%</span></div>, sortValue: (r) => r.progress },
        { key: "end_date", label: "Due", render: (r) => fmtDate(r.end_date), hideMobile: true },
      ]}
      view={layout === "Cards" ? (rows, { edit, del }) => (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => {
            const spent = spentFor(data.expenses, p.id);
            return (
              <div key={p.id} className="card group overflow-hidden transition hover:shadow-lg">
                <Link href={`/app/projects/${p.id}`} className="block">
                  <div className="relative h-32 overflow-hidden"><ProjectArt category={p.category} className="h-full w-full" /><div className="absolute left-3 top-3"><span className="rounded-full bg-white"><Badge>{p.status}</Badge></span></div></div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">{p.category}</p>
                    <h3 className="mt-1 truncate text-lg font-bold">{p.name}</h3>
                    <div className="mt-2 space-y-1 text-xs text-muted"><p className="flex items-center gap-1.5"><MapPin size={13} />{p.location || "No location"}</p><p className="flex items-center gap-1.5"><CalendarDays size={13} />Due {fmtDate(p.end_date)}</p></div>
                    <div className="mt-4 flex items-center justify-between text-xs"><span className="text-muted">Progress</span><span className="font-bold">{p.progress}%</span></div>
                    <div className="mt-1.5"><Progress value={p.progress} tone={p.status === "At Risk" ? "bad" : "brand"} /></div>
                    <div className="mt-4 flex justify-between border-t border-line pt-3 text-xs"><div><p className="text-muted">Budget</p><p className="font-bold">{money(p.budget, true)}</p></div><div className="text-right"><p className="text-muted">Spent</p><p className={`font-bold ${spent > p.budget ? "text-bad" : ""}`}>{money(spent, true)}</p></div></div>
                  </div>
                </Link>
                {canWrite && <div className="flex justify-end gap-1 border-t border-line px-3 py-2"><button className="btn-ghost btn-sm" onClick={() => edit(p)}><Pencil size={13} />Edit</button><button className="btn-ghost btn-sm text-bad" onClick={() => del(p)}><Trash2 size={13} />Delete</button></div>}
              </div>
            );
          })}
        </div>
      ) : undefined}
    />
  );
}
