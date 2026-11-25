"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AuthShell, { NotConfigured } from "@/components/AuthShell";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase/client";

function Form() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [fe, setFe] = useState<Record<string, string>>({});
  const notice = sp.get("signedout") ? "You have been signed out." : sp.get("reset") ? "Password updated. Sign in with your new password." : sp.get("error") === "link" ? "That link is invalid or has expired. Request a new one." : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = "Enter a valid email address";
    if (!password) errs.password = "Enter your password";
    setFe(errs); setErr("");
    if (Object.keys(errs).length) return;
    setBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: email.trim(), password });
    if (error) { setBusy(false); setErr(error.message === "Invalid login credentials" ? "The email or password is incorrect." : error.message); return; }
    const next = sp.get("next");
    router.replace(next && next.startsWith("/app") ? next : "/app");
    router.refresh();
  };

  return (
    <>
      {!isSupabaseConfigured && <NotConfigured />}
      {sp.get("notice") === "not-configured" && <p className="mb-4 text-sm text-bad">The workspace cannot be opened until authentication is configured.</p>}
      {notice && <p className="mb-4 rounded-md bg-ok/10 p-3 text-sm text-ok">{notice}</p>}
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div><label className="label" htmlFor="email">Email address</label><input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />{fe.email && <p className="mt-1 text-xs text-bad">{fe.email}</p>}</div>
        <div><div className="flex items-center justify-between"><label className="label" htmlFor="password">Password</label><Link href="/forgot-password" className="mb-1.5 text-xs font-semibold text-brand hover:underline">Forgot password?</Link></div>
          <input id="password" className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />{fe.password && <p className="mt-1 text-xs text-bad">{fe.password}</p>}</div>
        {err && <p role="alert" className="rounded-md bg-bad/10 p-3 text-sm text-bad">{err}</p>}
        <button className="btn-primary w-full py-3" disabled={busy || !isSupabaseConfigured}>{busy ? "Signing in" : "Sign in"}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New to SiteLedger? <Link href="/signup" className="font-semibold text-brand hover:underline">Create an account</Link></p>
    </>
  );
}
export default function Page() {
  return <AuthShell title="Sign in" subtitle="Welcome back. Open your workspace to continue."><Suspense fallback={null}><Form /></Suspense></AuthShell>;
}
