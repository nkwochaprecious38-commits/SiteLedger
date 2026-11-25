"use client";
import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/lib/data";
import { Badge, Empty, PageHeader } from "@/components/ui";
import { fmtDate } from "@/lib/utils";

function Results() {
  const q = (useSearchParams().get("q") || "").trim().toLowerCase();
  const { data } = useApp();
  const groups = useMemo(() => {
    if (!q) return [];
    const has = (...v: any[]) => v.some((x) => String(x ?? "").toLowerCase().includes(q));
    const pn = (id: string) => data.projects.find((p) => p.id === id)?.name || "";
    return [
      { name: "Projects", items: data.projects.filter((r) => has(r.name, r.client, r.location, r.description)).map((r) => ({ id: r.id, title: r.name, sub: `${r.location || ""} ${r.client ? "· " + r.client : ""}`, badge: r.status, href: `/app/projects/${r.id}` })) },
      { name: "Tasks", items: data.tasks.filter((r) => has(r.title, r.description)).map((r) => ({ id: r.id, title: r.title, sub: pn(r.project_id), badge: r.status, href: "/app/tasks" })) },
      { name: "Documents", items: data.documents.filter((r) => has(r.name, r.description, r.category, r.folder)).map((r) => ({ id: r.id, title: r.name, sub: `${r.category} · ${pn(r.project_id)}`, badge: undefined, href: "/app/documents" })) },
      { name: "Team members", items: data.team_members.filter((r) => has(r.name, r.email, r.role)).map((r) => ({ id: r.id, title: r.name, sub: `${r.role} · ${r.email || ""}`, badge: r.status, href: "/app/team" })) },
      { name: "Contractors", items: data.contractors.filter((r) => has(r.company_name, r.contact_person, r.specialty)).map((r) => ({ id: r.id, title: r.company_name, sub: `${r.specialty || ""} · ${r.contact_person || ""}`, badge: r.status, href: "/app/contractors" })) },
      { name: "Daily reports", items: data.daily_reports.filter((r) => has(r.activities, r.supervisor, r.notes, r.issues, r.safety)).map((r) => ({ id: r.id, title: `${pn(r.project_id)}: ${fmtDate(r.report_date)}`, sub: r.supervisor, badge: r.status, href: `/app/reports/${r.id}` })) },
      { name: "Issues", items: data.issues.filter((r) => has(r.title, r.description, r.corrective_action)).map((r) => ({ id: r.id, title: r.title, sub: pn(r.project_id), badge: r.severity, href: "/app/issues" })) },
    ].filter((g) => g.items.length);
  }, [q, data]);
  const total = groups.reduce((t, g) => t + g.items.length, 0);
  return (
    <div>
      <PageHeader title={q ? `Search results for "${q}"` : "Search"} subtitle={q ? `${total} result${total === 1 ? "" : "s"} across your workspace` : "Use the search bar above to find projects, tasks, documents, people, reports and issues."} />
      {q && total === 0 && <div className="card"><Empty title="No matches found" text="Try a different keyword, such as a project name, supplier or task title." /></div>}
      <div className="space-y-6">{groups.map((g) => (
        <section key={g.name}><h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{g.name} ({g.items.length})</h2>
          <div className="card divide-y divide-line">{g.items.map((i) => <Link key={i.id} href={i.href} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper"><div className="min-w-0"><p className="truncate font-semibold">{i.title}</p><p className="truncate text-xs text-muted">{i.sub}</p></div>{i.badge && <Badge>{i.badge}</Badge>}</Link>)}</div></section>
      ))}</div>
    </div>
  );
}
export default function Page() { return <Suspense fallback={null}><Results /></Suspense>; }
