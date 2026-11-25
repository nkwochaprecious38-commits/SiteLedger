import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CTA, PageHero, Section } from "@/components/marketing/Site";
import { DashboardPreview, FeatureVisual } from "@/components/marketing/Visuals";
import { MODULES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Construction Management Platform",
  description: "Explore the SiteLedger platform: project management, site reporting, financial tracking, documents, teams, materials, inspections and analytics connected in one construction workspace.",
  alternates: { canonical: "/platform" }, openGraph: { title: "SiteLedger Platform", description: "One platform connecting office and field operations for construction businesses." },
};

const CAPS = [
  { t: "Project management capabilities", k: "projects" as const, d: "Create a workspace for every project with status, schedule, budget, milestones, team and activity. Search, filter and sort the whole portfolio, and switch between card and table views." },
  { t: "Site reporting capabilities", k: "reports" as const, d: "Supervisors complete structured daily reports with weather, workforce, equipment, deliveries, safety observations, delays and photographs. Managers review, approve and export them." },
  { t: "Financial tracking", k: "budget" as const, d: "Set budgets by category, record expenses with receipts and move them through pending and approved states. Remaining budget and cost variance update as records change." },
  { t: "Document management", k: "documents" as const, d: "Keep drawings, contracts, permits and safety documents in folders linked to projects, with search, preview and download from any device." },
  { t: "Team coordination", k: "tasks" as const, d: "Assign tasks with priorities and due dates, follow them on a board, and see workload across people and projects." },
  { t: "Materials management", k: "materials" as const, d: "Track quantities, suppliers, deliveries and usage, and receive low stock alerts before a shortage affects the programme." },
  { t: "Issues and inspections", k: "issues" as const, d: "Log issues with severity and ownership, record inspections with findings, and track corrective actions through to closure." },
  { t: "Analytics and reporting", k: "analytics" as const, d: "Interactive charts show completion, budget performance, expense trends, delays, materials and workload, with CSV and PDF export." },
];

export default function Platform() {
  return (
    <>
      <PageHero eyebrow="Platform" title="The platform that connects the entire construction workflow." text="SiteLedger joins planning, site operations, finance, documentation and reporting in one workspace, so the office and the field work from the same facts.">
        <Link href="/signup" className="btn-primary px-6 py-3.5">Get Started<ArrowRight size={16} /></Link><Link href="/pricing" className="btn border border-white/25 px-6 py-3.5 text-white hover:bg-white/10">View Pricing</Link>
      </PageHero>
      <Section eyebrow="Visual overview" title="Everything about a project, in one place." intro="The workspace is organized around the project. Reports, costs, tasks, documents and people all attach to it.">
        <DashboardPreview />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{MODULES.map((m) => <div key={m.name} className="rounded-xl border border-line p-4"><p className="font-bold">{m.name}</p><p className="text-sm text-muted">{m.text}</p></div>)}</div>
      </Section>
      <Section tint eyebrow="Capabilities" title="Depth where construction teams need it.">
        <div className="space-y-16">{CAPS.map((c, i) => (
          <div key={c.t} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
            <div className={i % 2 ? "lg:order-2" : ""}><h3 className="text-2xl font-extrabold">{c.t}</h3><p className="mt-3 text-muted">{c.d}</p></div>
            <div className={i % 2 ? "lg:order-1" : ""}><FeatureVisual kind={c.k} /></div>
          </div>))}</div>
      </Section>
      <Section eyebrow="Office and field" title="How SiteLedger connects office and field operations." intro="Information should travel in both directions without delay.">
        <div className="grid gap-6 md:grid-cols-3">
          {[["The field records", "Supervisors submit daily reports, photographs, issues and material usage from site as work happens."], ["The platform connects", "Each record attaches to its project and updates budgets, stock levels, alerts and analytics automatically."], ["The office decides", "Managers review progress, approve costs, assign corrective actions and plan resources with current information."]].map(([t, d], i) => <div key={t} className="card p-7"><p className="font-heading text-sm font-extrabold text-brand">{String(i + 1).padStart(2, "0")}</p><h3 className="mt-3 text-lg font-bold">{t}</h3><p className="mt-2 text-sm text-muted">{d}</p></div>)}
        </div>
        <div className="mt-10 flex flex-wrap gap-3"><Link href="/solutions" className="btn-dark">See solutions by role<ArrowRight size={16} /></Link><Link href="/features" className="btn-outline">Browse all features</Link></div>
      </Section>
      <CTA />
    </>
  );
}
