"use client";
import { useEffect, useState } from "react";
import { ExternalLink, Check } from "lucide-react";
import { useApp, type Row } from "@/lib/data";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Avatar, Badge, Field, PageHeader, Tabs } from "@/components/ui";
import { PLANS, PLAN_CONTENT_CONFIRMED, planById } from "@/lib/plans";
import { cx, fmtDate } from "@/lib/utils";

const TABS = ["Profile", "Company", "Account", "Workspace", "Notifications", "Security", "Billing", "Users"];

export default function Settings() {
  const [tab, setTab] = useState("Profile");
  useEffect(() => { const t = new URLSearchParams(window.location.search).get("tab"); if (t && TABS.includes(t)) setTab(t); }, []);
  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your profile, company, security and subscription." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />
      <div className="max-w-3xl">
        {tab === "Profile" && <ProfileTab />}{tab === "Company" && <CompanyTab />}{tab === "Account" && <AccountTab />}{tab === "Workspace" && <WorkspaceTab />}
        {tab === "Notifications" && <NotificationsTab />}{tab === "Security" && <SecurityTab />}{tab === "Billing" && <BillingTab />}{tab === "Users" && <UsersTab />}
      </div>
    </div>
  );
}

function useSave(table: string, id: string, key: "profile" | "company" | "workspace") {
  const { patchLocal, notify } = useApp();
  const [busy, setBusy] = useState(false);
  return { busy, save: async (patch: Row) => {
    setBusy(true);
    const { error } = await supabaseBrowser().from(table).update(patch).eq("id", id);
    setBusy(false);
    if (error) { notify("bad", error.message); return; }
    patchLocal(key, patch); notify("ok", "Changes saved");
  } };
}

function ProfileTab() {
  const { profile } = useApp();
  const [f, setF] = useState({ full_name: profile.full_name || "", job_title: profile.job_title || "", phone: profile.phone || "" });
  const { busy, save } = useSave("profiles", profile.id, "profile");
  return (
    <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); if (!f.full_name.trim()) return; save(f); }}>
      <div className="flex items-center gap-4"><Avatar name={f.full_name} size={56} /><div><p className="font-bold">{profile.full_name}</p><p className="text-sm text-muted">{profile.email}</p></div></div>
      <Field label="Full name"><input className="input" required value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></Field>
      <Field label="Job title"><input className="input" value={f.job_title} onChange={(e) => setF({ ...f, job_title: e.target.value })} /></Field>
      <Field label="Phone"><input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
      <button className="btn-primary" disabled={busy}>{busy ? "Saving" : "Save profile"}</button>
    </form>
  );
}

const isAdmin = (role: string) => ["owner", "admin"].includes(role);

function CompanyTab() {
  const { company, role } = useApp();
  const [f, setF] = useState({ name: company.name || "", industry: company.industry || "", address: company.address || "", phone: company.phone || "", website: company.website || "" });
  const { busy, save } = useSave("companies", company.id, "company");
  const ro = !isAdmin(role);
  return (
    <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return; save(f); }}>
      {ro && <p className="rounded-md bg-paper p-3 text-sm text-muted">Only workspace owners and admins can edit company information.</p>}
      {(["name", "industry", "address", "phone", "website"] as const).map((k) => <Field key={k} label={k === "name" ? "Company name" : k[0].toUpperCase() + k.slice(1)}><input className="input" disabled={ro} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>)}
      {!ro && <button className="btn-primary" disabled={busy}>{busy ? "Saving" : "Save company"}</button>}
    </form>
  );
}

function AccountTab() {
  const { profile, role, signOut, workspace } = useApp();
  return (
    <div className="card divide-y divide-line">
      {[["Email address", profile.email], ["Workspace role", role], ["Workspace", workspace.name], ["Member since", fmtDate(profile.created_at)]].map(([k, v]) => <div key={k} className="flex justify-between gap-4 p-4 text-sm"><span className="text-muted">{k}</span><span className="font-semibold capitalize">{v}</span></div>)}
      <div className="p-4"><button className="btn-outline" onClick={signOut}>Sign out</button><p className="mt-3 text-xs text-muted">Account deletion is handled by your workspace owner. Contact your administrator to request removal.</p></div>
    </div>
  );
}

function WorkspaceTab() {
  const { workspace, role } = useApp();
  const [name, setName] = useState(workspace.name);
  const { busy, save } = useSave("workspaces", workspace.id, "workspace");
  return (
    <form className="card space-y-4 p-6" onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return; save({ name }); }}>
      <Field label="Workspace name"><input className="input" disabled={!isAdmin(role)} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Field label="Currency" hint="All financial values are reported in US dollars."><input className="input" disabled value={workspace.currency || "USD"} /></Field>
      {isAdmin(role) && <button className="btn-primary" disabled={busy}>{busy ? "Saving" : "Save workspace"}</button>}
    </form>
  );
}

function NotificationsTab() {
  const keys = [["tasks", "Task assignments and deadlines"], ["budget", "Budget alerts"], ["stock", "Low material stock"], ["reports", "Daily report submissions"], ["issues", "Issues requiring attention"], ["milestones", "Upcoming milestones"]];
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const { notify } = useApp();
  useEffect(() => { try { setPrefs(JSON.parse(localStorage.getItem("sl-notif-prefs") || "{}")); } catch {} }, []);
  const toggle = (k: string) => { const n = { ...prefs, [k]: prefs[k] === false }; setPrefs(n); try { localStorage.setItem("sl-notif-prefs", JSON.stringify(n)); notify("ok", "Preference saved"); } catch { notify("bad", "Preferences could not be saved in this browser"); } };
  return (
    <div className="card divide-y divide-line">
      {keys.map(([k, l]) => <label key={k} className="flex cursor-pointer items-center justify-between gap-4 p-4 text-sm"><span className="font-medium">{l}</span><input type="checkbox" className="h-4 w-4 accent-[#F36B32]" checked={prefs[k] !== false} onChange={() => toggle(k)} /></label>)}
      <p className="p-4 text-xs text-muted">Preferences are stored in this browser. Email delivery of notifications is not connected yet.</p>
    </div>
  );
}

function SecurityTab() {
  const { notify } = useApp();
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords do not match.");
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message);
    setPw(""); setPw2(""); notify("ok", "Password updated");
  };
  return (
    <div className="space-y-6">
      <form className="card space-y-4 p-6" onSubmit={submit}>
        <h2 className="font-bold">Change password</h2>
        <Field label="New password"><input className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
        <Field label="Confirm new password"><input className="input" type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} /></Field>
        {err && <p className="text-sm text-bad">{err}</p>}
        <button className="btn-primary" disabled={busy}>{busy ? "Updating" : "Update password"}</button>
      </form>
      <div className="card p-6"><h2 className="font-bold">Sessions</h2><p className="mt-1 text-sm text-muted">Sign out of every other device where you are signed in.</p>
        <button className="btn-outline mt-4" onClick={async () => { const { error } = await supabaseBrowser().auth.signOut({ scope: "others" }); notify(error ? "bad" : "ok", error ? error.message : "Other sessions signed out"); }}>Sign out other sessions</button></div>
    </div>
  );
}

function BillingTab() {
  const { subscription, workspace, role, patchLocal, notify } = useApp();
  const current = planById(subscription?.plan);
  const [busy, setBusy] = useState("");
  const choose = async (id: string) => {
    if (!isAdmin(role)) return notify("bad", "Only owners and admins can change the plan");
    setBusy(id);
    const { error } = await supabaseBrowser().from("subscriptions").update({ plan: id }).eq("workspace_id", workspace.id);
    setBusy("");
    if (error) return notify("bad", error.message);
    patchLocal("subscription", { plan: id }); notify("ok", "Plan selected. Continue to checkout to activate it.");
  };
  const status = subscription?.status || "pending_checkout";
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label">Selected plan</p><h2 className="text-2xl font-extrabold">{current.name} <span className="text-base font-semibold text-muted">${current.price} {current.cadence}</span></h2></div>
          <Badge tone={status === "active" ? "green" : "amber"}>{status === "active" ? "Active" : status === "pending_checkout" ? "Checkout not completed" : status.replace("_", " ")}</Badge></div>
        {status !== "active" && <div className="mt-4 rounded-lg bg-paper p-4 text-sm"><p className="font-semibold">Complete your subscription</p><p className="mt-1 text-muted">Checkout is handled on Selar. After payment, your plan is confirmed against the billing record. Automatic activation requires the Selar webhook integration, which is not connected yet, so activation may require a manual confirmation by the SiteLedger team.</p>
          <a href={current.checkoutUrl} target="_blank" rel="noopener noreferrer" className="btn-primary mt-4">Continue to checkout<ExternalLink size={15} /></a></div>}
        {subscription?.current_period_end && <p className="mt-4 text-sm text-muted">Current period ends {fmtDate(subscription.current_period_end)}</p>}
      </div>
      {!PLAN_CONTENT_CONFIRMED && <p className="rounded-md border border-warn/40 bg-warn/10 p-3 text-xs text-[#7a5410]">Prices come from the Selar subscription pages. Plan names and inclusions are provisional and need confirmation.</p>}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={cx("card flex flex-col p-5", p.id === current.id && "border-brand ring-1 ring-brand")}>
            <h3 className="font-bold">{p.name}</h3><p className="mt-1 font-heading text-2xl font-extrabold">${p.price}<span className="text-sm font-medium text-muted"> / month</span></p>
            <button className={cx("mt-auto pt-4")} onClick={() => choose(p.id)} disabled={busy === p.id || p.id === current.id}><span className={p.id === current.id ? "btn-outline w-full" : "btn-dark w-full"}>{p.id === current.id ? <><Check size={15} />Selected</> : busy === p.id ? "Saving" : "Select plan"}</span></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  const { workspace, role, user, notify } = useApp();
  const [rows, setRows] = useState<Row[] | null>(null);
  const load = async () => {
    const { data } = await supabaseBrowser().from("workspace_members").select("user_id, role, profiles(full_name, email)").eq("workspace_id", workspace.id);
    setRows(data || []);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);
  const change = async (uid: string, r: string) => {
    const { error } = await supabaseBrowser().from("workspace_members").update({ role: r }).eq("workspace_id", workspace.id).eq("user_id", uid);
    if (error) return notify("bad", error.message);
    notify("ok", "Role updated"); load();
  };
  return (
    <div className="card overflow-hidden">
      {!isAdmin(role) && <p className="border-b border-line bg-paper p-4 text-sm text-muted">Only owners and admins can change roles.</p>}
      {rows === null ? <p className="p-6 text-sm text-muted">Loading users</p> : <ul className="divide-y divide-line">{rows.map((m) => (
        <li key={m.user_id} className="flex flex-wrap items-center gap-3 p-4"><Avatar name={m.profiles?.full_name} /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{m.profiles?.full_name}</p><p className="truncate text-xs text-muted">{m.profiles?.email}</p></div>
          <select className="input w-auto" disabled={!isAdmin(role) || m.user_id === user.id || m.role === "owner"} value={m.role} onChange={(e) => change(m.user_id, e.target.value)}>{["owner", "admin", "manager", "member", "viewer"].map((r) => <option key={r} value={r} disabled={r === "owner"}>{r}</option>)}</select></li>))}</ul>}
      <p className="border-t border-line p-4 text-xs text-muted">To add colleagues who do not yet have a login, create them in Team. Sending account invitations requires an email service that is not connected yet.</p>
    </div>
  );
}
