import Link from "next/link";
import { ArrowRight, Check, Layers } from "lucide-react";
import { CTA, Section } from "@/components/marketing/Site";
import { DashboardPreview, FeatureVisual } from "@/components/marketing/Visuals";
import { CHALLENGES, FAQ, FEATURES, MODULES } from "@/lib/content";

export default function Home() {
  const faqLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <section className="relative overflow-hidden bg-ink text-white">
        <svg className="absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden="true"><defs><pattern id="hp" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#hp)" /></svg>
        <div className="container-x relative pb-16 pt-16 sm:pt-24">
          <p className="eyebrow">Construction management software</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">Every project. Every cost. Every update. Under control.</h1>
          <p className="mt-6 max-w-2xl text-lg text-white/70">SiteLedger brings construction projects, site reports, budgets, teams and documentation into one organized workspace, helping construction businesses stay on track from planning to completion.</p>
          <div className="mt-9 flex flex-wrap gap-3"><Link href="/signup" className="btn-primary px-7 py-3.5 text-base">Get Started<ArrowRight size={18} /></Link><Link href="/platform" className="btn border border-white/25 px-7 py-3.5 text-base text-white hover:bg-white/10">Explore the Platform</Link></div>
          <div className="mt-14 sm:mt-16"><DashboardPreview /><p className="mt-3 text-xs text-white/50">Illustrative preview of the SiteLedger workspace. Figures shown are sample data.</p></div>
        </div>
      </section>

      <Section eyebrow="Why a central platform" title="Construction runs on information. Most of it is scattered." intro="When project data lives in too many places, small problems stay hidden until they become expensive ones. SiteLedger gives your team one reliable source of truth.">
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {CHALLENGES.map((c, i) => <div key={c.title} className="bg-white p-7"><p className="font-heading text-sm font-extrabold text-brand">{String(i + 1).padStart(2, "0")}</p><h3 className="mt-3 text-lg font-bold">{c.title}</h3><p className="mt-2 text-sm text-muted">{c.text}</p></div>)}
        </div>
        <p className="mt-8 max-w-3xl text-muted">SiteLedger is a practical answer to these operational problems. It does not ask your crews to learn a complicated system. It gives each role the few tools they need and connects the results.</p>
      </Section>

      <Section tint eyebrow="Platform overview" title="One workspace that connects the whole workflow." intro="Eight connected areas share the same project record, so an update in the field is visible in the office without a phone call.">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((m) => <div key={m.name} className="card p-5 transition hover:border-brand"><Layers size={20} className="text-brand" /><h3 className="mt-4 font-bold">{m.name}</h3><p className="mt-1 text-sm text-muted">{m.text}</p></div>)}
        </div>
        <div className="mt-8"><Link href="/platform" className="btn-dark">Explore the Platform<ArrowRight size={16} /></Link></div>
      </Section>

      <Section eyebrow="Features" title="Built for the way construction teams actually work." intro="Each part of SiteLedger solves a specific operational problem. Together they give you control across every project.">
        <div className="space-y-20">
          {FEATURES.slice(0, 9).map((f, i) => (
            <div key={f.slug} className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16">
              <div className={i % 2 ? "lg:order-2" : ""}><p className="eyebrow">{String(i + 1).padStart(2, "0")}</p><h3 className="mt-2 text-2xl font-extrabold sm:text-3xl">{f.title}</h3><p className="mt-3 text-muted">{f.summary}</p><p className="mt-3 font-semibold">{f.value}</p>
                <ul className="mt-5 space-y-2 text-sm">{f.points.slice(0, 3).map((p) => <li key={p} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand" />{p}</li>)}</ul></div>
              <div className={i % 2 ? "lg:order-1" : ""}><FeatureVisual kind={f.kind} /></div>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-wrap gap-3"><Link href="/features" className="btn-dark">See all features<ArrowRight size={16} /></Link><Link href="/solutions" className="btn-outline">Browse solutions by role</Link></div>
      </Section>

      <Section tint eyebrow="The value of organized operations" title="Clarity compounds across every project.">
        <div className="grid gap-6 md:grid-cols-3">
          {[["Decisions with current facts", "When reports, costs and tasks are recorded as work happens, managers act on what is true today instead of last week."], ["Accountability that holds up", "Every report, expense, issue and decision is dated, attributed and stored against the project. Disputes become a matter of record."], ["Less time on administration", "Structured forms and a shared workspace replace re keying, chasing and searching. Teams spend more time building."]].map(([t, d]) => <div key={t} className="card p-7"><h3 className="text-lg font-bold">{t}</h3><p className="mt-3 text-sm text-muted">{d}</p></div>)}
        </div>
      </Section>

      <CTA />

      <Section id="faq" eyebrow="Frequently asked questions" title="Answers before you start.">
        <div className="max-w-3xl divide-y divide-line rounded-2xl border border-line">
          {FAQ.map((f) => <details key={f.q} className="group p-5 open:bg-paper"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold">{f.q}<span className="text-xl text-brand transition group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-3 text-sm text-muted">{f.a}</p></details>)}
        </div>
        <p className="mt-6 text-sm text-muted">Review plan details on the <Link href="/pricing" className="font-semibold text-brand hover:underline">pricing page</Link>.</p>
      </Section>
    </>
  );
}
