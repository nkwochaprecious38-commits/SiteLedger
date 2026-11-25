"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, ArrowRight } from "lucide-react";
import { cx } from "@/lib/utils";

const LINKS = [{ href: "/platform", label: "Platform" }, { href: "/solutions", label: "Solutions" }, { href: "/features", label: "Features" }, { href: "/pricing", label: "Pricing" }];

export function SiteNav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="container-x flex h-[68px] items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="SiteLedger home"><Image src="/logo.jpg" alt="SiteLedger logo" width={34} height={41} priority className="h-10 w-auto" /><span className="font-heading text-xl font-extrabold">SiteLedger</span></Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {LINKS.map((l) => <Link key={l.href} href={l.href} className={cx("rounded-md px-4 py-2 text-sm font-semibold transition hover:bg-paper", path === l.href ? "text-brand" : "text-ink")}>{l.label}</Link>)}
        </nav>
        <div className="hidden items-center gap-2 md:flex"><Link href="/login" className="btn-ghost">Log in</Link><Link href="/signup" className="btn-primary">Sign up</Link></div>
        <button className="rounded-md p-2 md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>{open ? <X /> : <Menu />}</button>
      </div>
      {open && (
        <div className="border-t border-line bg-white px-5 pb-5 pt-2 md:hidden">
          <Link href="/" onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 font-semibold">Home</Link>
          {LINKS.map((l) => <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="block rounded-md px-3 py-3 font-semibold">{l.label}</Link>)}
          <div className="mt-3 grid grid-cols-2 gap-3"><Link href="/login" className="btn-outline" onClick={() => setOpen(false)}>Log in</Link><Link href="/signup" className="btn-primary" onClick={() => setOpen(false)}>Sign up</Link></div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return <footer className="border-t border-line bg-white py-8 text-center text-sm text-muted">© 2026 SiteLedger</footer>;
}

export function Section({ id, eyebrow, title, intro, children, dark, tint, className }: { id?: string; eyebrow?: string; title: string; intro?: string; children?: React.ReactNode; dark?: boolean; tint?: boolean; className?: string }) {
  return (
    <section id={id} className={cx("py-16 sm:py-24", dark ? "bg-ink text-white" : tint ? "bg-paper" : "bg-white", className)}>
      <div className="container-x">
        <div className="max-w-3xl">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h2 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">{title}</h2>{intro && <p className={cx("mt-4 text-lg", dark ? "text-white/70" : "text-muted")}>{intro}</p>}</div>
        {children && <div className="mt-12">{children}</div>}
      </div>
    </section>
  );
}

export function CTA({ title = "Bring clarity to every construction project.", text = "Manage your projects, people, costs and site updates from one organized workspace.", label = "Start Managing Projects", href = "/signup" }: { title?: string; text?: string; label?: string; href?: string }) {
  return (
    <section className="bg-ink py-16 text-white sm:py-24">
      <div className="container-x flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
        <div className="max-w-2xl"><h2 className="text-3xl font-extrabold leading-tight sm:text-5xl">{title}</h2><p className="mt-4 text-lg text-white/70">{text}</p></div>
        <Link href={href} className="btn-primary px-7 py-4 text-base">{label}<ArrowRight size={18} /></Link>
      </div>
    </section>
  );
}

export function PageHero({ eyebrow, title, text, children }: { eyebrow: string; title: string; text: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <svg className="absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden="true"><defs><pattern id="hg" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M56 0H0V56" fill="none" stroke="white" /></pattern></defs><rect width="100%" height="100%" fill="url(#hg)" /></svg>
      <div className="container-x relative py-16 sm:py-24"><p className="eyebrow">{eyebrow}</p><h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.08] sm:text-6xl">{title}</h1><p className="mt-6 max-w-2xl text-lg text-white/70">{text}</p>{children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}</div>
    </section>
  );
}
