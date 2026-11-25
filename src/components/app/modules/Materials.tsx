"use client";
import { useState } from "react";
import { AlertTriangle, ArrowDownUp } from "lucide-react";
import { useApp, type Row } from "@/lib/data";
import { CrudModule } from "@/components/app/Crud";
import { Badge, Modal, Stat } from "@/components/ui";
import { useNames } from "./shared";
import { fmtDate, money, num, stockStatus, today } from "@/lib/utils";
import { UNITS } from "@/lib/constants";

export function MaterialsModule({ projectId }: { projectId?: string }) {
  const { data, create, update, canWrite, notify } = useApp();
  const names = useNames();
  const mats = data.materials.filter((m) => !projectId || m.project_id === projectId);
  const low = mats.filter((m) => stockStatus(m) !== "In Stock");
  const value = mats.reduce((t, m) => t + Number(m.quantity) * Number(m.cost_per_unit), 0);
  const [rec, setRec] = useState<Row | null>(null);
  const [kind, setKind] = useState("usage");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const history = data.inventory_records.filter((r) => mats.some((m) => m.id === r.material_id)).sort((a, b) => b.record_date.localeCompare(a.record_date)).slice(0, 8);

  const saveRecord = async () => {
    const q = Number(qty);
    if (!rec || !q || q <= 0) { notify("bad", "Enter a quantity greater than zero"); return; }
    if (kind === "usage" && q > Number(rec.quantity)) { notify("bad", `Only ${rec.quantity} ${rec.unit} available`); return; }
    const r = await create("inventory_records", { material_id: rec.id, project_id: rec.project_id, kind, quantity: q, record_date: today(), notes: note });
    if (r) {
      const next = kind === "usage" ? Number(rec.quantity) - q : Number(rec.quantity) + q;
      await update("materials", rec.id, { quantity: next, ...(kind === "delivery" ? { delivery_date: today() } : {}) });
      notify("ok", kind === "usage" ? "Usage recorded" : "Delivery recorded");
      setRec(null); setQty(""); setNote("");
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Material items" value={mats.length} /><Stat label="Low or out of stock" value={low.length} tone={low.length ? "bad" : "ok"} /><Stat label="Inventory value" value={money(value, true)} /><Stat label="Suppliers" value={new Set(mats.map((m) => m.supplier).filter(Boolean)).size} />
      </div>
      {low.length > 0 && <div className="rounded-lg border border-warn/40 bg-warn/10 p-4"><p className="flex items-center gap-2 text-sm font-bold text-[#9a6a12]"><AlertTriangle size={16} />Low stock alert</p><ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">{low.map((m) => <li key={m.id}><span className="font-semibold">{m.name}</span>: {num(m.quantity)} {m.unit} left (reorder at {num(m.reorder_level)})</li>)}</ul></div>}
      <CrudModule
        table="materials" noun="Material" rows={mats} searchKeys={["name", "supplier", "description"]}
        fixed={projectId ? { project_id: projectId } : undefined} exportName="materials" defaultSort={{ key: "name", dir: "asc" }}
        fields={[
          { key: "name", label: "Material name", type: "text", required: true, full: true },
          { key: "description", label: "Description", type: "textarea" },
          { key: "quantity", label: "Quantity available", type: "number", min: 0, required: true },
          { key: "unit", label: "Unit of measurement", type: "select", options: UNITS, required: true },
          { key: "cost_per_unit", label: "Cost per unit (USD)", type: "number", min: 0, required: true },
          { key: "reorder_level", label: "Low stock threshold", type: "number", min: 0 },
          { key: "supplier", label: "Supplier", type: "text" },
          { key: "project_id", label: "Associated project", type: "project" },
          { key: "delivery_date", label: "Delivery date", type: "date" },
          { key: "notes", label: "Notes", type: "textarea" },
        ]}
        beforeSave={(v) => ({ ...v, reorder_level: v.reorder_level ?? 0 })}
        defaults={{ unit: "units" }}
        filters={[
          { key: "status", label: "Stock", options: ["In Stock", "Low Stock", "Out of Stock"], match: (r, v) => stockStatus(r) === v },
          ...(projectId ? [] : [{ key: "project_id", label: "Project", options: data.projects.map((p) => ({ value: p.id, label: p.name })) }]),
          { key: "supplier", label: "Supplier", options: [...new Set(data.materials.map((m) => m.supplier).filter(Boolean))] as string[] },
        ]}
        columns={[
          { key: "name", label: "Material", render: (r) => <div><p className="font-semibold">{r.name}</p><p className="text-xs text-muted">{r.supplier}</p></div> },
          { key: "quantity", label: "Quantity", render: (r) => `${num(r.quantity)} ${r.unit}`, sortValue: (r) => Number(r.quantity) },
          { key: "cost_per_unit", label: "Unit cost", render: (r) => money(r.cost_per_unit), sortValue: (r) => Number(r.cost_per_unit), hideMobile: true },
          { key: "value", label: "Value", render: (r) => money(Number(r.quantity) * Number(r.cost_per_unit)), sortValue: (r) => Number(r.quantity) * Number(r.cost_per_unit), hideMobile: true },
          ...(projectId ? [] : [{ key: "project_id", label: "Project", render: (r: any) => names.project(r.project_id), hideMobile: true }]),
          { key: "delivery_date", label: "Delivered", render: (r) => (r.delivery_date ? fmtDate(r.delivery_date) : "None"), hideMobile: true },
          { key: "stock", label: "Stock", render: (r) => <Badge>{stockStatus(r)}</Badge>, sortValue: (r) => Number(r.quantity) },
        ]}
        rowActions={(r) => canWrite ? <button className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" onClick={() => { setRec(r); setKind("usage"); }} aria-label="Record usage or delivery" title="Record usage or delivery"><ArrowDownUp size={15} /></button> : null}
      />
      {history.length > 0 && <section className="card p-5"><h2 className="mb-3 font-bold">Recent inventory records</h2><ul className="divide-y divide-line text-sm">{history.map((h) => <li key={h.id} className="flex items-center justify-between gap-3 py-2.5"><span><span className="font-semibold">{data.materials.find((m) => m.id === h.material_id)?.name}</span> <span className="text-muted">{h.notes}</span></span><span className="shrink-0 text-xs"><Badge tone={h.kind === "usage" ? "amber" : "green"}>{h.kind}</Badge> {num(h.quantity)} · {fmtDate(h.record_date)}</span></li>)}</ul></section>}
      <Modal open={!!rec} onClose={() => setRec(null)} title={`Record movement: ${rec?.name || ""}`} footer={<><button className="btn-outline" onClick={() => setRec(null)}>Cancel</button><button className="btn-primary" onClick={saveRecord}>Save record</button></>}>
        <div className="space-y-4"><p className="text-sm text-muted">Currently {num(rec?.quantity)} {rec?.unit} available.</p>
          <div><label className="label">Type</label><select className="input" value={kind} onChange={(e) => setKind(e.target.value)}><option value="usage">Usage on site</option><option value="delivery">Delivery received</option></select></div>
          <div><label className="label">Quantity ({rec?.unit})</label><input className="input" type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} /></div>
          <div><label className="label">Notes</label><input className="input" value={note} onChange={(e) => setNote(e.target.value)} /></div></div>
      </Modal>
    </div>
  );
}
