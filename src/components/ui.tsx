"use client";
import { useEffect, type ReactNode } from "react";
import { X, Inbox } from "lucide-react";
import { cx } from "@/lib/utils";

const TONES: Record<string, string> = {
  green: "bg-ok/10 text-ok", amber: "bg-warn/15 text-[#9a6a12]", red: "bg-bad/10 text-bad",
  gray: "bg-ink/5 text-muted", orange: "bg-brand-soft text-brand-dark", dark: "bg-ink text-white",
};
const MAP: Record<string, string> = {
  Active: "green", Completed: "green", Approved: "green", Passed: "green", Resolved: "green", Closed: "gray", "In Stock": "green", Preferred: "green", Submitted: "orange",
  Planning: "gray", Draft: "gray", Pending: "amber", Scheduled: "gray", Low: "gray", Medium: "amber", "To Do": "gray", Invited: "amber", Inactive: "gray",
  "On Hold": "amber", "Under Review": "amber", "Low Stock": "amber", "Action Required": "amber", High: "orange", Open: "red", "In Progress": "orange",
  "At Risk": "red", Urgent: "red", Critical: "red", Failed: "red", Rejected: "red", "Out of Stock": "red",
};
export function Badge({ children, tone }: { children: ReactNode; tone?: string }) {
  const t = tone || MAP[String(children)] || "gray";
  return <span className={cx("inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold", TONES[t])}>{children}</span>;
}

export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-[90] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className={cx("flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-paper" aria-label="Close"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Confirm({ open, title, message, confirmLabel = "Delete", busy, onConfirm, onCancel }: { open: boolean; title: string; message: string; confirmLabel?: string; busy?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return (
    <Modal open={open} onClose={onCancel} title={title} footer={<>
      <button className="btn-outline" onClick={onCancel}>Cancel</button>
      <button className="btn-danger" disabled={busy} onClick={onConfirm}>{busy ? "Working" : confirmLabel}</button>
    </>}>
      <p className="text-sm text-muted">{message}</p>
    </Modal>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Empty({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-paper text-muted"><Inbox size={22} /></div>
      <h3 className="font-bold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "ok" | "bad" | "warn" }) {
  const c = { brand: "bg-brand", ok: "bg-ok", bad: "bg-bad", warn: "bg-warn" }[tone];
  return <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10"><div className={cx("h-full rounded-full transition-all", c)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>;
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "bad" | "ok" }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={cx("mt-2 font-heading text-2xl font-extrabold", tone === "bad" && "text-bad", tone === "ok" && "text-ok")}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Avatar({ name, size = 32 }: { name?: string | null; size?: number }) {
  const i = (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  return <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-bold text-white" style={{ width: size, height: size, fontSize: size * 0.38 }}>{i}</span>;
}

export function Tabs({ tabs, value, onChange }: { tabs: string[]; value: string; onChange: (t: string) => void }) {
  return (
    <div className="no-print -mx-1 mb-6 overflow-x-auto border-b border-line">
      <div className="flex min-w-max gap-1 px-1" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={value === t} onClick={() => onChange(t)}
            className={cx("border-b-2 px-4 py-3 text-sm font-semibold transition", value === t ? "border-brand text-ink" : "border-transparent text-muted hover:text-ink")}>{t}</button>
        ))}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <div><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-muted">{hint}</p>}</div>;
}
