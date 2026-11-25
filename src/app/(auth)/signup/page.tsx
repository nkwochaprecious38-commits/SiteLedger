"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { NotConfigured } from "@/components/AuthShell";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase/client";
import { PLANS, planById } from "@/lib/plans";

function Form() {
  const router = useRouter();
  const sp = useSearchParams();
  const [f, setF] = useState({ name: "", company: "", email: "", password: "", confirm: "", terms: false, plan: planById(sp.get("plan")).id as string });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [fe, setFe] = useState<Record<string, string>>({}); const [sent, setSent] = useState(false);
  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (f.name.trim().length < 2) errs.name = "Enter your full name";
    if (f.company.trim().length < 2) errs.company = "Enter your company name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) errs.email = "Enter a valid email address";
    if (f.password.length < 8) errs.password = "Use at least 8 characters";
    else if (!/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) errs.password = "Include at least one letter and one number";
    if (f.confirm !== f.password) errs.confirm = "Passwords do not match";
    if (!f.terms) errs.terms = "You must accept the terms to continue";
    setFe(errs); setErr("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    const { data, error } = await supabaseBrowser().auth.signUp({
      email: f.email.trim(), password: f.password,
      options: { data: { full_name: f.name.trim(), company_name: f.company.trim(), plan: f.plan }, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setBusy(false); setErr(error.message); return; }
    if (data.session) { router.replace("/app"); router.refresh(); return; }
    setBusy(false); setSent(true);
  };

  if (sent) return (
    <div className="rounded-xl border border-line bg-paper p-6"><h2 className="text-lg font-bold">Check your email</h2><p className="mt-2 text-sm text-muted">We sent a confirmation link to <span className="font-semibold text-ink">{f.email}</span>. Open it to activate your account, then sign in.</p><Link href="/login" className="btn-dark mt-5">Go to sign in</Link></div>
  );
  const Err = ({ k }: { k: string }) => (fe[k] ? <p className="mt-1 text-xs text-bad">{fe[k]}</p> : null);
  return (
    <>
      {!isSupabaseConfigured && <NotConfigured />}
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} /><Err k="name" /></div>
        <div><label className="label" htmlFor="company">Company name</label><input id="company" className="input" autoComplete="organization" value={f.company} onChange={(e) => set("company", e.target.value)} /><Err k="company" /></div>
        <div><label className="label" htmlFor="email">Work email</label><input id="email" className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} /><Err k="email" /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="pw">Password</label><input id="pw" className="input" type="password" autoComplete="new-password" value={f.password} onChange={(e) => set("password", e.target.value)} /><Err k="password" /></div>
          <div><label className="label" htmlFor="pw2">Confirm password</label><input id="pw2" className="input" type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => set("confirm", e.target.value)} /><Err k="confirm" /></div>
        </div>
        <div><label className="label" htmlFor="plan">Plan</label><select id="plan" className="input" value={f.plan} onChange={(e) => set("plan", e.target.value)}>{PLANS.map((p) => <option key={p.id} value={p.id}>{p.name}: ${p.price} per month</option>)}</select><p className="mt-1 text-xs text-muted">You complete payment on the checkout step after signing in.</p></div>
        <div><label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#F36B32]" checked={f.terms} onChange={(e) => set("terms", e.target.checked)} /><span>I agree to the SiteLedger terms of service and privacy policy.</span></label><Err k="terms" /></div>
        {err && <p role="alert" className="rounded-md bg-bad/10 p-3 text-sm text-bad">{err}</p>}
        <button className="btn-primary w-full py-3" disabled={busy || !isSupabaseConfigured}>{busy ? "Creating account" : "Create account"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand hover:underline">Sign in</Link></p>
    </>
  );
}
export default function Page() {
  return <AuthShell title="Create your account" subtitle="Set up a workspace for your company in a few minutes."><Suspense fallback={null}><Form /></Suspense></AuthShell>;
}
