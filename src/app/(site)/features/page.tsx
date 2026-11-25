import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CTA, PageHero } from "@/components/marketing/Site";
import { FeatureVisual } from "@/components/marketing/Visuals";
import { FEATURES } from "@/lib/content";

export const metadata: Metadata = {
  title: "Construction Management Features",
  description: "Project management, tasks, daily site reports, documents, budgets and expenses, materials, teams, contractors, inspections, analytics, notifications and search in one platform.",
  alternates: { canonical: "/features" }, openGraph: { title: "SiteLedger Features", description: "Every feature construction teams need to manage projects, sites and costs." },
};

export default function Features() {
  return (
    <>
      <PageHero eyebrow="Features" title="Every tool a construction team needs, working together." text="Twelve connected capabilities share one project record. Use what you need today and grow into the rest.">
        <Link href="/signup" className="btn-primary px-6 py-3.5">Get Started<ArrowRight size={16} /></Link><Link href="/pricing" className="btn border border-white/25 px-6 py-3.5 text-white hover:bg-white/10">View Pricing</Link>
      </PageHero>
      <div className="border-b border-line bg-white"><div className="container-x flex gap-2 overflow-x-auto py-3">{FEATURES.map((f) => <a key={f.slug} href={`#${f.slug}`} className="shrink-0 rounded-full border border-line px-4 py-1.5 text-sm font-semibold hover:border-brand hover:text-brand">{f.title}</a>)}</div></div>
      {FEATURES.map((f, i) => (
        <section key={f.slug} id={f.slug} className={`scroll-mt-20 py-16 sm:py-20 ${i % 2 ? "bg-paper" : "bg-white"}`}>
          <div className="container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className={i % 2 ? "lg:order-2" : ""}>
              <p className="eyebrow">{String(i + 1).padStart(2, "0")}</p><h2 className="mt-2 text-3xl font-extrabold">{f.title}</h2>
              <p className="mt-4 text-muted">{f.summary}</p>
              <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">Operational value</p><p className="mt-1 font-semibold">{f.value}</p>
              <ul className="mt-5 space-y-2 text-sm">{f.points.map((p) => <li key={p} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand" />{p}</li>)}</ul>
              <Link href="/signup" className="btn-dark mt-7">{f.cta}<ArrowRight size={16} /></Link>
            </div>
            <div className={i % 2 ? "lg:order-1" : ""}><FeatureVisual kind={f.kind} /></div>
          </div>
        </section>
      ))}
      <section className="bg-white py-14"><div className="container-x flex flex-wrap items-center gap-4"><p className="font-bold">Keep exploring:</p><Link href="/platform" className="btn-outline">Platform</Link><Link href="/solutions" className="btn-outline">Solutions</Link><Link href="/pricing" className="btn-outline">Pricing</Link></div></section>
      <CTA />
    </>
  );
}
