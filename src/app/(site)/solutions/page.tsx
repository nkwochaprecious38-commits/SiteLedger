import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CTA, PageHero, Section } from "@/components/marketing/Site";
import { FeatureVisual } from "@/components/marketing/Visuals";
import { SOLUTIONS } from "@/lib/content";

export const metadata: Metadata = {
  title: "Construction Software Solutions by Role",
  description: "See how SiteLedger helps general contractors, project managers, site supervisors, small construction companies, subcontractors, operations teams and property developers.",
  alternates: { canonical: "/solutions" }, openGraph: { title: "SiteLedger Solutions", description: "Construction management solutions for every role on the project." },
};

export default function Solutions() {
  return (
    <>
      <PageHero eyebrow="Solutions" title="Built for everyone who delivers the project." text="Different roles face different pressures. SiteLedger gives each one the tools and visibility they need, on a shared record.">
        <Link href="/signup" className="btn-primary px-6 py-3.5">Get Started<ArrowRight size={16} /></Link><Link href="/platform" className="btn border border-white/25 px-6 py-3.5 text-white hover:bg-white/10">Explore the Platform</Link>
      </PageHero>
      <div className="border-b border-line bg-white"><div className="container-x flex gap-2 overflow-x-auto py-3">{SOLUTIONS.map((s) => <a key={s.slug} href={`#${s.slug}`} className="shrink-0 rounded-full border border-line px-4 py-1.5 text-sm font-semibold hover:border-brand hover:text-brand">{s.title}</a>)}</div></div>
      {SOLUTIONS.map((s, i) => (
        <section key={s.slug} id={s.slug} className={`scroll-mt-20 py-16 sm:py-20 ${i % 2 ? "bg-paper" : "bg-white"}`}>
          <div className="container-x grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className={i % 2 ? "lg:order-2" : ""}>
              <p className="eyebrow">For {s.title}</p><h2 className="mt-3 text-3xl font-extrabold">{s.title}</h2>
              <h3 className="mt-6 text-xs font-bold uppercase tracking-wide text-muted">The challenge</h3><p className="mt-1.5">{s.challenge}</p>
              <h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">How SiteLedger helps</h3><p className="mt-1.5">{s.help}</p>
              <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">{s.features.map((f) => <li key={f} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand" />{f}</li>)}</ul>
              <div className="mt-7 flex flex-wrap gap-3"><Link href="/signup" className="btn-primary">Get Started</Link><Link href="/features" className="btn-outline">View features</Link><Link href="/platform" className="btn-ghost">Platform</Link></div>
            </div>
            <div className={i % 2 ? "lg:order-1" : ""}><FeatureVisual kind={s.kind} /></div>
          </div>
        </section>
      ))}
      <CTA title="Find the plan that fits your team." text="Compare plans and start organizing your projects today." label="View Pricing" href="/pricing" />
    </>
  );
}
