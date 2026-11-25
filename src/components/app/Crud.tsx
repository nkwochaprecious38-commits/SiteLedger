"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Plus, Search, Pencil, Trash2, ArrowUp, ArrowDown, Download } from "lucide-react";
import { useApp, type Row, type Table } from "@/lib/data";
import { Confirm, Empty, Modal, Field } from "@/components/ui";
import { downloadCSV } from "@/lib/utils";

export type FieldType = "text" | "textarea" | "number" | "date" | "select" | "project" | "member" | "projects" | "email" | "tel";
export interface FieldDef {
  key: string; label: string; type: FieldType; options?: string[]; required?: boolean; full?: boolean;
  placeholder?: string; min?: number; hidden?: boolean;
}
export interface ColumnDef { key: string; label: string; render?: (row: Row) => ReactNode; sortValue?: (row: Row) => any; className?: string; hideMobile?: boolean }
export interface FilterDef { key: string; label: string; options: string[] | { value: string; label: string }[]; match?: (row: Row, value: string) => boolean }

interface Props {
  table: Table; noun: string; fields: FieldDef[]; columns: ColumnDef[];
  rows?: Row[]; filters?: FilterDef[]; searchKeys: string[]; fixed?: Row; defaults?: Row;
  defaultSort?: { key: string; dir: "asc" | "desc" };
  rowActions?: (row: Row) => ReactNode; onRowClick?: (row: Row) => void;
  headerExtra?: ReactNode; beforeSave?: (v: Row) => Row; afterSave?: (saved: Row, wasNew: boolean) => Promise<void> | void;
  extraModal?: ReactNode; view?: (rows: Row[], helpers: { edit: (r: Row) => void; del: (r: Row) => void }) => ReactNode;
  viewToggle?: ReactNode; exportName?: string; emptyText?: string; compact?: boolean; formExtra?: (v: Row, set: (patch: Row) => void) => ReactNode;
  validate?: (v: Row) => string | null;
}

export function CrudModule(p: Props) {
  const { data, create, update, remove, canWrite, notify } = useApp();
  const source = p.rows ?? data[p.table];
  const [q, setQ] = useState("");
  const [fv, setFv] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(p.defaultSort || { key: p.columns[0].key, dir: "asc" as const });
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Row>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<Row | null>(null);

  const rows = useMemo(() => {
    let r = source.filter((x) => (p.fixed ? Object.entries(p.fixed).every(([k, v]) => x[k] === v) : true));
    if (q.trim()) {
      const s = q.toLowerCase();
      r = r.filter((x) => p.searchKeys.some((k) => String(x[k] ?? "").toLowerCase().includes(s)));
    }
    p.filters?.forEach((f) => {
      const v = fv[f.key];
      if (v) r = r.filter((x) => (f.match ? f.match(x, v) : String(x[f.key]) === v));
    });
    const col = p.columns.find((c) => c.key === sort.key);
    const val = (x: Row) => (col?.sortValue ? col.sortValue(x) : x[sort.key]);
    return [...r].sort((a, b) => {
      const A = val(a), B = val(b);
      const c = typeof A === "number" && typeof B === "number" ? A - B : String(A ?? "").localeCompare(String(B ?? ""), undefined, { numeric: true });
      return sort.dir === "asc" ? c : -c;
    });
  }, [source, q, fv, sort, p]);

  const openNew = () => { setIsNew(true); setEditing({}); setErrors({}); setForm({ ...Object.fromEntries(p.fields.map((f) => [f.key, f.type === "projects" ? [] : f.type === "number" ? "" : f.type === "select" ? f.options?.[0] ?? "" : ""])), ...p.defaults, ...p.fixed }); };
  const openEdit = (r: Row) => { setIsNew(false); setEditing(r); setErrors({}); setForm({ ...r }); };
  const close = () => setEditing(null);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("new") === "1" && canWrite && !p.fixed) { openNew(); window.history.replaceState(null, "", window.location.pathname); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    const errs: Record<string, string> = {};
    p.fields.forEach((f) => {
      if (f.hidden) return;
      const v = form[f.key];
      if (f.required && (v === "" || v == null)) errs[f.key] = `${f.label} is required`;
      if (f.type === "email" && v && !/^\S+@\S+\.\S+$/.test(v)) errs[f.key] = "Enter a valid email address";
      if (f.type === "number" && v !== "" && v != null && (isNaN(Number(v)) || (f.min !== undefined && Number(v) < f.min))) errs[f.key] = `Enter a number${f.min !== undefined ? ` of ${f.min} or more` : ""}`;
    });
    const custom = p.validate?.(form);
    if (custom) errs._form = custom;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    let payload: Row = {};
    p.fields.forEach((f) => {
      let v = form[f.key];
      if (f.type === "number") v = v === "" || v == null ? null : Number(v);
      else if (v === "" && ["date", "project", "member"].includes(f.type)) v = null;
      payload[f.key] = v;
    });
    if (p.fixed) payload = { ...payload, ...p.fixed };
    if (p.beforeSave) payload = p.beforeSave(payload);
    const created = isNew ? await create(p.table, payload) : null;
    const ok = isNew ? !!created : await update(p.table, editing!.id, payload);
    if (ok) {
      await p.afterSave?.(isNew ? created! : { ...editing, ...payload }, isNew);
      notify("ok", `${p.noun} ${isNew ? "created" : "updated"}`);
      close();
    }
    setBusy(false);
  };

  const doDelete = async () => {
    if (!toDelete) return;
    setBusy(true);
    if (await remove(p.table, toDelete.id)) notify("ok", `${p.noun} deleted`);
    setBusy(false); setToDelete(null);
  };

  const toggleSort = (key: string) => setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input className="input pl-9" placeholder={`Search ${p.noun.toLowerCase()}s`} value={q} onChange={(e) => setQ(e.target.value)} aria-label={`Search ${p.noun}s`} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {p.filters?.map((f) => (
            <select key={f.key} className="input w-auto min-w-[8.5rem]" value={fv[f.key] || ""} onChange={(e) => setFv({ ...fv, [f.key]: e.target.value })} aria-label={f.label}>
              <option value="">{f.label}: All</option>
              {f.options.map((o) => typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
          {p.viewToggle}
          {p.headerExtra}
          {p.exportName && <button className="btn-outline" disabled={!rows.length} onClick={() => downloadCSV(`${p.exportName}.csv`, rows.map(({ workspace_id, ...r }) => r))}><Download size={16} />CSV</button>}
          {canWrite && <button className="btn-primary" onClick={openNew}><Plus size={16} />New {p.noun.toLowerCase()}</button>}
        </div>
      </div>

      {p.view ? (rows.length ? p.view(rows, { edit: openEdit, del: setToDelete }) : <div className="card"><Empty title={`No ${p.noun.toLowerCase()}s found`} text={p.emptyText || "Adjust your search or filters, or create a new record."} /></div>) : (
        <div className="card overflow-hidden">
          {rows.length === 0 ? <Empty title={`No ${p.noun.toLowerCase()}s found`} text={p.emptyText || "Adjust your search or filters, or create a new record."} action={canWrite ? <button className="btn-primary" onClick={openNew}><Plus size={16} />New {p.noun.toLowerCase()}</button> : undefined} /> : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="border-b border-line bg-paper"><tr>
                    {p.columns.map((c) => (
                      <th key={c.key} className="th"><button className="inline-flex items-center gap-1 uppercase tracking-wide" onClick={() => toggleSort(c.key)}>{c.label}{sort.key === c.key && (sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}</button></th>
                    ))}
                    <th className="th w-28 text-right">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((r) => (
                      <tr key={r.id} className={p.onRowClick ? "cursor-pointer hover:bg-paper/70" : "hover:bg-paper/50"} onClick={() => p.onRowClick?.(r)}>
                        {p.columns.map((c) => <td key={c.key} className={`td ${c.className || ""}`}>{c.render ? c.render(r) : String(r[c.key] ?? "")}</td>)}
                        <td className="td text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end gap-1">
                            {p.rowActions?.(r)}
                            {canWrite && <button className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" onClick={() => openEdit(r)} aria-label="Edit"><Pencil size={15} /></button>}
                            {canWrite && <button className="rounded-md p-1.5 text-muted hover:bg-bad/10 hover:text-bad" onClick={() => setToDelete(r)} aria-label="Delete"><Trash2 size={15} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="divide-y divide-line md:hidden">
                {rows.map((r) => (
                  <div key={r.id} className="space-y-2 p-4" onClick={() => p.onRowClick?.(r)}>
                    {p.columns.filter((c) => !c.hideMobile).map((c, i) => (
                      <div key={c.key} className={i === 0 ? "font-semibold" : "flex items-start justify-between gap-4 text-sm"}>
                        {i !== 0 && <span className="text-muted">{c.label}</span>}
                        <span className={i === 0 ? "" : "text-right"}>{c.render ? c.render(r) : String(r[c.key] ?? "")}</span>
                      </div>
                    ))}
                    <div className="flex justify-end gap-1 pt-1" onClick={(e) => e.stopPropagation()}>
                      {p.rowActions?.(r)}
                      {canWrite && <button className="btn-outline btn-sm" onClick={() => openEdit(r)}><Pencil size={13} />Edit</button>}
                      {canWrite && <button className="btn-outline btn-sm text-bad" onClick={() => setToDelete(r)}><Trash2 size={13} />Delete</button>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <Modal open={!!editing} onClose={close} title={`${isNew ? "New" : "Edit"} ${p.noun.toLowerCase()}`} wide
        footer={<><button className="btn-outline" onClick={close}>Cancel</button><button className="btn-primary" onClick={save} disabled={busy}>{busy ? "Saving" : isNew ? `Create ${p.noun.toLowerCase()}` : "Save changes"}</button></>}>
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save(); }} noValidate>
          {errors._form && <p className="rounded-md bg-bad/10 px-3 py-2 text-sm text-bad sm:col-span-2">{errors._form}</p>}
          {p.fields.filter((f) => !f.hidden && !(p.fixed && f.key in p.fixed)).map((f) => (
            <div key={f.key} className={f.full || f.type === "textarea" || f.type === "projects" ? "sm:col-span-2" : ""}>
              <Field label={f.label + (f.required ? " *" : "")}>
                <FieldInput f={f} value={form[f.key]} onChange={(v) => setForm({ ...form, [f.key]: v })} />
              </Field>
              {errors[f.key] && <p className="mt-1 text-xs text-bad">{errors[f.key]}</p>}
            </div>
          ))}
          {p.formExtra?.(form, (patch) => setForm((f) => ({ ...f, ...patch })))}
          <button type="submit" className="hidden" />
        </form>
      </Modal>
      {p.extraModal}
      <Confirm open={!!toDelete} title={`Delete ${p.noun.toLowerCase()}`} message={`This will permanently delete this ${p.noun.toLowerCase()}. This action cannot be undone.`} busy={busy} onConfirm={doDelete} onCancel={() => setToDelete(null)} />
    </div>
  );
}

export function FieldInput({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
  const { data } = useApp();
  const v = value ?? "";
  switch (f.type) {
    case "textarea": return <textarea className="input min-h-[96px]" value={v} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    case "select": return <select className="input" value={v} onChange={(e) => onChange(e.target.value)}>{!f.required && <option value="">None</option>}{f.options!.map((o) => <option key={o}>{o}</option>)}</select>;
    case "project": return <select className="input" value={v} onChange={(e) => onChange(e.target.value)}><option value="">{f.required ? "Select project" : "No project"}</option>{data.projects.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>;
    case "member": return <select className="input" value={v} onChange={(e) => onChange(e.target.value)}><option value="">Unassigned</option>{data.team_members.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>;
    case "projects": return (
      <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-line p-2">
        {data.projects.length === 0 && <p className="p-1 text-sm text-muted">Create a project first.</p>}
        {data.projects.map((x) => (
          <label key={x.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-paper">
            <input type="checkbox" className="accent-[#F36B32]" checked={(value || []).includes(x.id)} onChange={(e) => onChange(e.target.checked ? [...(value || []), x.id] : (value || []).filter((i: string) => i !== x.id))} />{x.name}
          </label>
        ))}
      </div>
    );
    case "number": return <input className="input" type="number" step="any" min={f.min} value={v} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    default: return <input className="input" type={f.type} value={v} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  }
}
