"use client";
import { useState } from "react";
import Link from "next/link";
import AuthShell, { NotConfigured } from "@/components/AuthShell";
import { isSupabaseConfigured, supabaseBrowser } from "@/lib/supabase/client";

export default function Page() {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Enter a valid email address");
    setErr(""); setBusy(true);
    const { error } = await supabaseBrowser().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setBusy(false);
    if (error) return setErr(error.message);
    setSent(true);
  };
  return (
    <AuthShell title="Reset your password" subtitle="Enter your email and we will send a reset link.">
      {!isSupabaseConfigured && <NotConfigured />}
      {sent ? <div className="rounded-xl border border-line bg-paper p-6 text-sm"><p className="font-bold">Check your email</p><p className="mt-2 text-muted">If an account exists for {email}, a reset link is on its way.</p><Link href="/login" className="btn-dark mt-5">Back to sign in</Link></div> : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          <div><label className="label" htmlFor="email">Email address</label><input id="email" className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          {err && <p role="alert" className="rounded-md bg-bad/10 p-3 text-sm text-bad">{err}</p>}
          <button className="btn-primary w-full py-3" disabled={busy || !isSupabaseConfigured}>{busy ? "Sending" : "Send reset link"}</button>
          <p className="text-center text-sm text-muted"><Link href="/login" className="font-semibold text-brand hover:underline">Back to sign in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
