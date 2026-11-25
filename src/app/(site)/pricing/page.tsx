import type { Metadata } from "next";
import Link from "next/link";
import { Check, Info, Minus } from "lucide-react";
import { CTA, PageHero } from "@/components/marketing/Site";
import { PLANS, PLAN_CONTENT_CONFIRMED } from "@/lib/plans";
import { FAQ } from "@/lib/content";

export const metadata: Metadata = {
  title: "Pricing",
  description: "SiteLedger subscription plans for construction businesses, priced at $47, $57 and $97 per month.",
  alternates: { canonical: "/pricing" }, openGraph: { title: "SiteLedger Pricing", description: "Simple monthly plans for construction project management." },
};

export default function Pricing() {
  return (
    <>
      <PageHero eyebrow="Pricing" title="Simple monthly plans for construction teams." text="Choose the plan that matches how many projects and people you manage. Every plan is billed monthly and can be changed later." />
      <section className="bg-paper py-14 sm:py-20">
        <div className="container-x">
          {!PLAN_CONTENT_CONFIRMED && (
            <div className="mb-10 flex gap-3 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm text-[#7a5410]"><Info size={18} className="mt-0.5 shrink-0" /><p><span className="font-bold">To be confirmed:</span> prices and monthly billing match the three Selar subscription pages. Those pages do not list plan names or inclusions, so the plan names and feature lists below are proposed and must be confirmed before launch.</p></div>
          )}
          <div className="grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div key={p.id} className={`relative flex flex-col rounded-2xl border bg-white p-8 ${p.recommended ? "border-brand shadow-xl ring-1 ring-brand lg:-mt-4 lg:pb-12" : "border-line shadow-card"}`}>
                {p.recommended && <span className="absolute -top-3 left-8 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">Recommended</span>}
                <h2 className="text-xl font-extrabold">{p.name}</h2><p className="mt-1 text-sm text-muted">{p.tagline}</p>
                <p className="mt-6 font-heading text-5xl font-extrabold">${p.price}<span className="text-base font-semibold text-muted"> {p.cadence}</span></p>
                <p className="mt-1 text-xs text-muted">Billed monthly in USD</p>
                <Link href={`/signup?plan=${p.id}`} className={`mt-6 ${p.recommended ? "btn-primary" : "btn-dark"} py-3`}>Choose {p.name}</Link>
                <ul className="mt-8 space-y-3 text-sm">{p.includes.map((i) => <li key={i} className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-brand" />{i}</li>)}{p.limits.map((l) => <li key={l} className="flex gap-2 text-muted"><Minus size={16} className="mt-0.5 shrink-0" />{l}</li>)}</ul>
              </div>
            ))}
          </div>
          <div className="mt-12 max-w-3xl text-sm text-muted"><h2 className="text-lg font-bold text-ink">How subscription works</h2><p className="mt-2">Create an account, pick a plan, then complete checkout on Selar from your billing settings. You can change your selected plan at any time from Settings. Explore the <Link href="/features" className="font-semibold text-brand hover:underline">features</Link>, the <Link href="/platform" className="font-semibold text-brand hover:underline">platform</Link> or <Link href="/solutions" className="font-semibold text-brand hover:underline">solutions by role</Link> before you decide.</p></div>
        </div>
      </section>
      <section className="bg-white py-16"><div className="container-x max-w-3xl"><h2 className="text-2xl font-extrabold">Pricing questions</h2>
        <div className="mt-6 divide-y divide-line rounded-2xl border border-line">{FAQ.filter((f) => ["What subscription plans are available?", "How do I get started?", "Can I manage multiple construction projects?"].includes(f.q)).map((f) => <div key={f.q} className="p-5"><h3 className="font-bold">{f.q}</h3><p className="mt-2 text-sm text-muted">{f.a}</p></div>)}</div></div></section>
      <CTA />
    </>
  );
}
