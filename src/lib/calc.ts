import type { Row } from "@/lib/data";
import { sum } from "@/lib/utils";

export const spentFor = (expenses: Row[], projectId?: string, includePending = true) =>
  sum(expenses.filter((e) => (!projectId || e.project_id === projectId) && (e.status === "Approved" || (includePending && e.status === "Pending"))), "amount");

export const approvedFor = (expenses: Row[], projectId?: string) =>
  sum(expenses.filter((e) => (!projectId || e.project_id === projectId) && e.status === "Approved"), "amount");

export const monthKey = (d: string) => d.slice(0, 7);
export const monthLabel = (k: string) => new Date(k + "-01T00:00:00").toLocaleDateString("en-US", { month: "short", year: "2-digit" });

export function monthlySpend(expenses: Row[]) {
  const map: Record<string, number> = {};
  expenses.filter((e) => e.status !== "Rejected").forEach((e) => { const k = monthKey(e.expense_date); map[k] = (map[k] || 0) + Number(e.amount); });
  return Object.keys(map).sort().map((k) => ({ month: monthLabel(k), amount: map[k] }));
}

export function byCategory(expenses: Row[]) {
  const map: Record<string, number> = {};
  expenses.filter((e) => e.status !== "Rejected").forEach((e) => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
  return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export const CHART = { brand: "#F36B32", ink: "#171A1D", slate: "#252B30", muted: "#737B83", line: "#E4E7EB", ok: "#2E8B57", warn: "#E6A23C", bad: "#D64545" };
export const SERIES = ["#F36B32", "#171A1D", "#737B83", "#2E8B57", "#E6A23C", "#5B7C99", "#B0B6BC", "#D64545"];
