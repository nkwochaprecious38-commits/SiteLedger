import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Link href="/" className="flex items-center gap-2.5 self-start"><Image src="/logo.jpg" alt="SiteLedger home" width={32} height={39} className="h-9 w-auto" /><span className="font-heading text-xl font-extrabold">SiteLedger</span></Link>
        <div className="mx-auto my-auto w-full max-w-md py-10">
          <h1 className="text-3xl font-extrabold">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <aside className="relative hidden overflow-hidden bg-ink text-white lg:block">
        <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true"><defs><pattern id="g" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M48 0H0V48" fill="none" stroke="white" strokeWidth="1" /></pattern></defs><rect width="100%" height="100%" fill="url(#g)" /></svg>
        <div className="relative flex h-full flex-col justify-end p-14">
          <p className="eyebrow">Construction operations</p>
          <h2 className="mt-4 max-w-md text-4xl font-extrabold leading-tight">Every project. Every cost. Every update. Under control.</h2>
          <ul className="mt-8 space-y-3 text-sm text-white/70"><li>Projects, budgets and site reports in one workspace</li><li>Row level security keeps every company's data separate</li><li>Built for office teams and field teams</li></ul>
        </div>
      </aside>
    </div>
  );
}

export const NotConfigured = () => (
  <div className="mb-6 rounded-lg border border-warn/40 bg-warn/10 p-4 text-sm text-[#7a5410]">
    <p className="font-bold">Authentication is not configured</p>
    <p className="mt-1">Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in the environment, apply the database migration and restart the app. See the README for the exact steps.</p>
  </div>
);
