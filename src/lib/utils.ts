export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");
export const money = (n: number | string | null | undefined, compact = false) => {
  const v = Number(n || 0);
  return new Intl.NumberFormat("en-US", {
    style: "currency", currency: "USD", maximumFractionDigits: 0,
    ...(compact ? { notation: "compact", maximumFractionDigits: 1 } : {}),
  }).format(v);
};
export const num = (n: number | string | null | undefined) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(n || 0));
export const fmtDate = (d?: string | null) => {
  if (!d) return "Not set";
  const date = new Date(d.length === 10 ? d + "T00:00:00" : d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};
export const today = () => new Date().toISOString().slice(0, 10);
export const daysFromToday = (d?: string | null) => {
  if (!d) return null;
  const a = new Date(d.length === 10 ? d + "T00:00:00" : d).getTime();
  const b = new Date(today() + "T00:00:00").getTime();
  return Math.round((a - b) / 86400000);
};
export const addDays = (n: number) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);
export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
};
export const initials = (name?: string | null) =>
  (name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
export const sum = (arr: any[], key: string) => arr.reduce((t, r) => t + Number(r[key] || 0), 0);

export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export const stockStatus = (m: Record<string, any>) => {
  const q = Number(m.quantity), r = Number(m.reorder_level);
  if (q <= 0) return "Out of Stock";
  if (q <= r) return "Low Stock";
  return "In Stock";
};
