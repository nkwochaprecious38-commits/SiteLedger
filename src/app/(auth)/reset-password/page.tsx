"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setErr(""); setBusy(true);
    const sb = supabaseBrowser();
    const { error } = await sb.auth.updateUser({ password: pw });
    if (error) { setBusy(false); return setErr(error.message); }
    await sb.auth.signOut();
    router.replace("/login?reset=1");
  };
  return (
    <AuthShell title="Choose a new password" subtitle="Use the link from your email to reach this page.">
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div><label className="label" htmlFor="pw">New password</label><input id="pw" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
        <div><label className="label" htmlFor="pw2">Confirm password</label><input id="pw2" className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></div>
        {err && <p role="alert" className="rounded-md bg-bad/10 p-3 text-sm text-bad">{err}</p>}
        <button className="btn-primary w-full py-3" disabled={busy}>{busy ? "Updating" : "Update password"}</button>
      </form>
    </AuthShell>
  );
}
