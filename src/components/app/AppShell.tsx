"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as Icons from "lucide-react";
import { Bell, ChevronDown, ChevronRight, Menu, PanelLeftClose, PanelLeftOpen, Plus, Search, X, LogOut, Settings as SettingsIcon, Check } from "lucide-react";
import { DataProvider, useApp } from "@/lib/data";
import { seedWorkspace } from "@/lib/seed";
import { NAV } from "@/lib/constants";
import { Avatar } from "@/components/ui";
import { cx } from "@/lib/utils";

const iconFor = (n: string) => (Icons as any)[n] || Icons.Circle;

export default function AppShell({ children }: { children: ReactNode }) {
  return <DataProvider seed={seedWorkspace}><Shell>{children}</Shell></DataProvider>;
}

function useOutside(ref: React.RefObject<HTMLElement | null>, fn: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) fn(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, fn]);
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { notifications, data, company, workspace } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => { try { setCollapsed(localStorage.getItem("sl-collapsed") === "1"); } catch {} }, []);
  useEffect(() => setMobileOpen(false), [pathname]);
  const toggle = () => setCollapsed((c) => { try { localStorage.setItem("sl-collapsed", c ? "0" : "1"); } catch {} return !c; });

  const crumbs = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean).slice(1);
    const out: { label: string; href: string }[] = [{ label: "Overview", href: "/app" }];
    let href = "/app";
    parts.forEach((p, i) => {
      href += `/${p}`;
      const nav = NAV.find((n) => n.href === href);
      const label = nav?.label || data.projects.find((x) => x.id === p)?.name || (i === 0 ? p : "Details");
      if (href !== "/app") out.push({ label, href });
    });
    return out;
  }, [pathname, data.projects]);

  const unread = notifications.filter((n) => !n.read).length;

  const sidebar = (mini: boolean) => (
    <div className="flex h-full flex-col bg-ink text-white">
      <div className={cx("flex h-16 shrink-0 items-center border-b border-white/10", mini ? "justify-center" : "gap-3 px-5")}>
        <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-md bg-white"><Image src="/logo.jpg" alt="SiteLedger" width={28} height={34} className="h-8 w-auto" /></span>
        {!mini && <span className="font-heading text-lg font-extrabold">SiteLedger</span>}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Application">
        {NAV.map((n) => {
          const I = iconFor(n.icon);
          const active = n.href === "/app" ? pathname === "/app" : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} title={mini ? n.label : undefined}
              className={cx("flex items-center rounded-md py-2.5 text-sm font-medium transition", mini ? "justify-center px-0" : "gap-3 px-3", active ? "bg-brand text-white" : "text-white/70 hover:bg-white/10 hover:text-white")}>
              <I size={18} className="shrink-0" />{!mini && <span className="truncate">{n.label}</span>}
            </Link>
          );
        })}
      </nav>
      {!mini && (
        <div className="m-3 rounded-lg bg-white/5 p-3 text-xs text-white/60">
          <p className="font-semibold text-white">{company?.name}</p>
          <p className="mt-0.5 truncate">{workspace?.name}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-paper">
      <aside className={cx("no-print fixed inset-y-0 left-0 z-40 hidden transition-all lg:block", collapsed ? "w-[72px]" : "w-64")}>{sidebar(collapsed)}</aside>
      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{sidebar(false)}
            <button className="absolute right-3 top-4 rounded-md p-1.5 text-white/70 hover:bg-white/10" onClick={() => setMobileOpen(false)} aria-label="Close menu"><X size={18} /></button>
          </aside>
        </div>
      )}
      <div className={cx("print-reset transition-all", collapsed ? "lg:pl-[72px]" : "lg:pl-64")}>
        <Topbar onMenu={() => setMobileOpen(true)} collapsed={collapsed} onToggle={toggle} unread={unread} />
        <div className="no-print border-b border-line bg-white px-4 py-2.5 sm:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-muted">
            {crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={12} />}
                {i === crumbs.length - 1 ? <span className="font-semibold text-ink">{c.label}</span> : <Link href={c.href} className="hover:text-ink">{c.label}</Link>}
              </span>
            ))}
          </nav>
        </div>
        <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

function Topbar({ onMenu, collapsed, onToggle, unread }: { onMenu: () => void; collapsed: boolean; onToggle: () => void; unread: number }) {
  const router = useRouter();
  const { profile, company, workspace, signOut, canWrite } = useApp();
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<"" | "quick" | "notif" | "user" | "ws">("");
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setMenu(""));
  const go = (e: React.FormEvent) => { e.preventDefault(); if (q.trim()) router.push(`/app/search?q=${encodeURIComponent(q.trim())}`); };
  const quick = [
    { label: "New project", href: "/app/projects?new=1" }, { label: "New task", href: "/app/tasks?new=1" },
    { label: "New daily report", href: "/app/reports?new=1" }, { label: "Record expense", href: "/app/budget?new=1" },
    { label: "Report an issue", href: "/app/issues?new=1" }, { label: "Upload document", href: "/app/documents?new=1" },
  ];
  return (
    <header ref={ref} className="no-print sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-line bg-white px-4 sm:gap-3 sm:px-8">
      <button className="rounded-md p-2 text-ink hover:bg-paper lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu size={20} /></button>
      <button className="hidden rounded-md p-2 text-muted hover:bg-paper lg:block" onClick={onToggle} aria-label="Toggle sidebar">{collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}</button>
      <div className="relative hidden md:block">
        <button className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-semibold hover:bg-paper" onClick={() => setMenu(menu === "ws" ? "" : "ws")}>
          <span className="max-w-[10rem] truncate">{company?.name}</span><ChevronDown size={14} />
        </button>
        {menu === "ws" && (
          <div className="absolute left-0 top-12 w-64 rounded-lg border border-line bg-white p-2 shadow-xl">
            <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">Workspace</p>
            <div className="flex items-center justify-between rounded-md bg-paper px-3 py-2 text-sm"><span className="truncate font-medium">{workspace?.name}</span><Check size={16} className="text-brand" /></div>
            <p className="px-3 py-2 text-xs text-muted">Additional workspaces are not enabled for this account.</p>
          </div>
        )}
      </div>
      <form onSubmit={go} className="relative min-w-0 flex-1 sm:max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Search projects, tasks, documents" aria-label="Global search" />
      </form>
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {canWrite && (
          <div className="relative">
            <button className="btn-primary px-3 sm:px-4" onClick={() => setMenu(menu === "quick" ? "" : "quick")}><Plus size={16} /><span className="hidden sm:inline">Quick action</span></button>
            {menu === "quick" && (
              <div className="absolute right-0 top-12 w-56 rounded-lg border border-line bg-white p-1.5 shadow-xl">
                {quick.map((a) => <button key={a.href} className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-paper" onClick={() => { setMenu(""); router.push(a.href); }}>{a.label}</button>)}
              </div>
            )}
          </div>
        )}
        <div className="relative">
          <button className="relative rounded-md p-2 text-ink hover:bg-paper" onClick={() => setMenu(menu === "notif" ? "" : "notif")} aria-label="Notifications">
            <Bell size={20} />{unread > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
          </button>
          {menu === "notif" && <NotificationPanel close={() => setMenu("")} />}
        </div>
        <div className="relative">
          <button className="flex items-center gap-2 rounded-md p-1 hover:bg-paper" onClick={() => setMenu(menu === "user" ? "" : "user")} aria-label="Account menu"><Avatar name={profile?.full_name} /></button>
          {menu === "user" && (
            <div className="absolute right-0 top-12 w-60 rounded-lg border border-line bg-white p-1.5 shadow-xl">
              <div className="border-b border-line px-3 py-2"><p className="truncate text-sm font-semibold">{profile?.full_name}</p><p className="truncate text-xs text-muted">{profile?.email}</p></div>
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-paper" onClick={() => { setMenu(""); router.push("/app/settings"); }}><SettingsIcon size={15} />Account and settings</button>
              <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-bad hover:bg-paper" onClick={signOut}><LogOut size={15} />Sign out</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function NotificationPanel({ close }: { close: () => void }) {
  const { notifications, markRead } = useApp();
  const router = useRouter();
  const list = notifications.slice(0, 30);
  const tone = { info: "bg-ink/30", warn: "bg-warn", bad: "bg-bad" };
  return (
    <div className="absolute right-[-3.5rem] top-12 w-[22rem] max-w-[92vw] rounded-lg border border-line bg-white shadow-xl sm:right-0">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="font-bold">Notifications</p>
        <button className="text-xs font-semibold text-brand hover:underline" onClick={() => markRead(list.filter((n) => !n.read).map((n) => n.key))}>Mark all as read</button>
      </div>
      <div className="max-h-[26rem] divide-y divide-line overflow-y-auto">
        {list.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted">You are all caught up.</p>}
        {list.map((n) => (
          <button key={n.key} className={cx("flex w-full gap-3 px-4 py-3 text-left hover:bg-paper", n.read && "opacity-60")} onClick={() => { markRead([n.key]); close(); router.push(n.href); }}>
            <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-line" : tone[n.severity])} />
            <span className="min-w-0"><span className="block text-xs font-semibold uppercase tracking-wide text-muted">{n.type}</span><span className="block truncate text-sm font-semibold">{n.title}</span><span className="block text-xs text-muted">{n.body}</span></span>
          </button>
        ))}
      </div>
    </div>
  );
}
