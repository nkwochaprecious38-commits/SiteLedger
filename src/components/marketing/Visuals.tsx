import type { VisualKind } from "@/lib/content";

const Bar = ({ w, c = "bg-brand" }: { w: number; c?: string }) => <div className="h-2 rounded-full bg-ink/10"><div className={`h-full rounded-full ${c}`} style={{ width: `${w}%` }} /></div>;
const Chip = ({ children, t = "gray" }: { children: React.ReactNode; t?: "gray" | "orange" | "green" | "red" | "amber" }) => {
  const c = { gray: "bg-ink/5 text-muted", orange: "bg-brand-soft text-brand-dark", green: "bg-ok/10 text-ok", red: "bg-bad/10 text-bad", amber: "bg-warn/15 text-[#9a6a12]" }[t];
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${c}`}>{children}</span>;
};

export function FeatureVisual({ kind }: { kind: VisualKind }) {
  const frame = "rounded-2xl border border-line bg-paper p-4 sm:p-5";
  const row = "flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-xs shadow-card";
  switch (kind) {
    case "projects": return (
      <div className={frame}><div className="grid gap-3 sm:grid-cols-2">{[["Harbor View Office Tower", 54, "Active", "green"], ["Riverside Residences", 61, "At Risk", "red"], ["Northgate Warehouse", 38, "Active", "green"], ["Elm Street Clinic", 5, "Planning", "gray"]].map(([n, p, s, t]: any) => (
        <div key={n} className="rounded-lg bg-white p-3 shadow-card"><div className="flex items-start justify-between gap-2"><p className="text-xs font-bold">{n}</p><Chip t={t}>{s}</Chip></div><div className="mt-3"><Bar w={p} c={t === "red" ? "bg-bad" : "bg-brand"} /></div><p className="mt-1.5 text-[10px] text-muted">{p}% complete</p></div>))}</div></div>);
    case "tasks": return (
      <div className={frame}><div className="grid grid-cols-3 gap-3">{[["To Do", ["Order dock levellers", "Confirm crane extension"]], ["In Progress", ["Level 8 rebar inspection", "Recovery programme"]], ["Under Review", ["Curtain wall drawings"]]].map(([h, items]: any) => (
        <div key={h}><p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-muted">{h}</p><div className="space-y-2">{items.map((i: string) => <div key={i} className="rounded-lg bg-white p-2.5 text-[11px] font-semibold shadow-card">{i}<div className="mt-2"><Chip t={h === "Under Review" ? "amber" : "orange"}>{h === "To Do" ? "Medium" : "High"}</Chip></div></div>)}</div></div>))}</div></div>);
    case "reports": return (
      <div className={frame}><div className="rounded-lg bg-white p-4 shadow-card"><div className="flex items-center justify-between border-b-2 border-ink pb-2"><p className="text-xs font-extrabold">Daily Site Report</p><Chip t="orange">Submitted</Chip></div>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px]">{[["Weather", "Clear"], ["Workforce", "64"], ["Supervisor", "M. Santos"]].map(([k, v]) => <div key={k}><dt className="font-bold uppercase text-muted">{k}</dt><dd className="font-semibold">{v}</dd></div>)}</dl>
        <div className="mt-3 space-y-1.5"><div className="h-2 w-full rounded bg-ink/10" /><div className="h-2 w-5/6 rounded bg-ink/10" /><div className="h-2 w-2/3 rounded bg-ink/10" /></div></div></div>);
    case "documents": return (
      <div className={frame}><div className="space-y-2">{[["Structural drawings Rev D", "Drawings"], ["Main contract agreement", "Contracts"], ["Building permit BP 2231", "Permits"], ["Site safety plan", "Safety Documents"]].map(([n, c]) => <div key={n} className={row}><span className="font-semibold">{n}</span><Chip>{c}</Chip></div>)}</div></div>);
    case "budget": return (
      <div className={frame}><div className="flex h-32 items-end gap-3 rounded-lg bg-white p-4 shadow-card">{[[70, 60], [55, 62], [40, 30], [65, 70], [20, 12]].map(([a, b], i) => <div key={i} className="flex h-full flex-1 items-end gap-1"><div className="w-1/2 rounded-t bg-line" style={{ height: `${a}%` }} /><div className="w-1/2 rounded-t bg-brand" style={{ height: `${b}%` }} /></div>)}</div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">{[["Budget", "$4.8M"], ["Spent", "$2.1M"], ["Remaining", "$2.7M"]].map(([k, v]) => <div key={k} className="rounded-lg bg-white p-2 shadow-card"><p className="text-muted">{k}</p><p className="text-sm font-extrabold">{v}</p></div>)}</div></div>);
    case "materials": return (
      <div className={frame}><div className="space-y-2">{[["Ready mix concrete", "85 m3", "In Stock", "green"], ["Reinforcing bar 16mm", "14 tonnes", "Low Stock", "amber"], ["Waterproofing membrane", "0 rolls", "Out of Stock", "red"]].map(([n, q, s, t]: any) => <div key={n} className={row}><div><p className="font-semibold">{n}</p><p className="text-muted">{q}</p></div><Chip t={t}>{s}</Chip></div>)}</div></div>);
    case "team": return (
      <div className={frame}><div className="grid gap-2 sm:grid-cols-2">{[["DO", "Daniel Okafor", "Project Manager"], ["MS", "Maria Santos", "Site Supervisor"], ["JW", "James Whitfield", "Engineer"], ["TB", "Tom Becker", "Safety Officer"]].map(([i, n, r]) => <div key={n} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-card"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">{i}</span><div><p className="text-xs font-bold">{n}</p><p className="text-[10px] text-muted">{r}</p></div></div>)}</div></div>);
    case "contractors": return (
      <div className={frame}><div className="space-y-2">{[["Apex Mechanical", "HVAC", "Preferred", "green"], ["Buckeye Earthworks", "Excavation", "Active", "gray"], ["Sealtight Systems", "Roofing", "On Hold", "amber"]].map(([n, s, st, t]: any) => <div key={n} className={row}><div><p className="font-semibold">{n}</p><p className="text-muted">{s}</p></div><Chip t={t}>{st}</Chip></div>)}</div></div>);
    case "issues": return (
      <div className={frame}><div className="space-y-2">{[["Water ingress at terrace junction", "Critical", "red"], ["Missing edge protection, level 7", "High", "orange"], ["Rebar cover below tolerance", "Medium", "amber"]].map(([n, s, t]: any) => <div key={n} className={row}><span className="font-semibold">{n}</span><Chip t={t}>{s}</Chip></div>)}<div className={row}><span className="font-semibold">Level 7 slab pre pour inspection</span><Chip t="green">Passed</Chip></div></div></div>);
    case "analytics": return (
      <div className={frame}><div className="rounded-lg bg-white p-4 shadow-card"><svg viewBox="0 0 300 110" className="w-full" aria-hidden="true"><g stroke="#E4E7EB">{[20, 50, 80].map((y) => <line key={y} x1="0" x2="300" y1={y} y2={y} />)}</g><polyline fill="none" stroke="#171A1D" strokeWidth="2.5" points="0,90 50,78 100,70 150,52 200,44 250,30 300,20" /><polyline fill="none" stroke="#F36B32" strokeWidth="2.5" points="0,96 50,92 100,80 150,74 200,60 250,56 300,40" />{[[100, 80], [200, 60], [300, 40]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="3.5" fill="#F36B32" />)}</svg></div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">{[["Completion", "54%"], ["Task rate", "71%"], ["Variance", "+4.2%"]].map(([k, v]) => <div key={k} className="rounded-lg bg-white p-2 shadow-card"><p className="text-muted">{k}</p><p className="text-sm font-extrabold">{v}</p></div>)}</div></div>);
    case "notifications": return (
      <div className={frame}><div className="space-y-2">{[["Overdue task", "Approve curtain wall shop drawings", "red"], ["Budget alert", "Riverside Residences at 92% of budget", "amber"], ["Low material stock", "Reinforcing bar 16mm", "amber"], ["Upcoming milestone", "Block B roof deck sign off in 9 days", "gray"]].map(([t, b, c]: any) => <div key={t} className="rounded-lg bg-white p-3 shadow-card"><div className="flex items-center gap-2"><Chip t={c}>{t}</Chip></div><p className="mt-1.5 text-xs font-semibold">{b}</p></div>)}</div></div>);
    case "search": return (
      <div className={frame}><div className="rounded-lg bg-white p-3 text-xs shadow-card"><div className="rounded-md border border-line px-3 py-2 text-muted">waterproofing</div><div className="mt-3 space-y-2">{[["Issues", "Water ingress at terrace junction"], ["Tasks", "Resolve waterproofing defect, Block B"], ["Documents", "Waterproofing method statement"]].map(([g, n]) => <div key={n} className="flex items-center justify-between gap-2 border-b border-line pb-2 last:border-0"><span className="font-semibold">{n}</span><Chip>{g}</Chip></div>)}</div></div></div>);
  }
}

export function DashboardPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-paper text-ink shadow-2xl ring-1 ring-black/10">
      <div className="flex items-center gap-1.5 border-b border-line bg-white px-4 py-2.5"><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="h-2.5 w-2.5 rounded-full bg-line" /><span className="ml-3 text-[10px] font-semibold text-muted">SiteLedger workspace: Overview</span></div>
      <div className="grid grid-cols-[3.2rem_1fr] sm:grid-cols-[9rem_1fr]">
        <div className="space-y-1.5 bg-ink p-2 sm:p-3">{["Overview", "Projects", "Tasks", "Reports", "Budget", "Materials"].map((n, i) => <div key={n} className={`truncate rounded px-2 py-1.5 text-[10px] font-semibold ${i === 0 ? "bg-brand text-white" : "text-white/60"}`}><span className="hidden sm:inline">{n}</span><span className="sm:hidden">{n[0]}</span></div>)}</div>
        <div className="space-y-3 p-3 sm:p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{[["Active projects", "12"], ["Budget", "$18.4M"], ["Spent", "$9.7M"], ["At risk", "2"]].map(([k, v], i) => <div key={k} className="rounded-lg bg-white p-2.5 shadow-card"><p className="text-[9px] font-semibold uppercase tracking-wide text-muted">{k}</p><p className={`text-base font-extrabold sm:text-lg ${i === 3 ? "text-bad" : ""}`}>{v}</p></div>)}</div>
          <div className="grid gap-3 sm:grid-cols-5">
            <div className="rounded-lg bg-white p-3 shadow-card sm:col-span-3"><p className="mb-2 text-[10px] font-bold">Budget versus spend</p><div className="flex h-24 items-end gap-2">{[[80, 62], [60, 58], [45, 20], [70, 66], [35, 12], [55, 40]].map(([a, b], i) => <div key={i} className="flex h-full flex-1 items-end gap-0.5"><div className="w-1/2 rounded-t-sm bg-line" style={{ height: `${a}%` }} /><div className="w-1/2 rounded-t-sm bg-brand" style={{ height: `${b}%` }} /></div>)}</div></div>
            <div className="rounded-lg bg-white p-3 shadow-card sm:col-span-2"><p className="mb-2 text-[10px] font-bold">Recent updates</p><ul className="space-y-1.5 text-[10px]">{["Level 8 slab pour approved", "Daily report submitted", "Expense approved: $64,000", "Inspection passed"].map((u) => <li key={u} className="flex gap-1.5"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{u}</li>)}</ul></div>
          </div>
          <div className="rounded-lg bg-white p-3 shadow-card"><p className="mb-2 text-[10px] font-bold">Project progress</p><div className="space-y-2">{[["Harbor View Office Tower", 54], ["Riverside Residences", 61], ["Northgate Warehouse", 38]].map(([n, p]: any) => <div key={n}><div className="mb-1 flex justify-between text-[10px]"><span className="font-semibold">{n}</span><span>{p}%</span></div><Bar w={p} c={n.startsWith("River") ? "bg-bad" : "bg-brand"} /></div>)}</div></div>
        </div>
      </div>
    </div>
  );
}
