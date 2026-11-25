"use client";
import { useMemo, useState } from "react";
import { Download, Eye, Folder, FolderOpen, FileText } from "lucide-react";
import { useApp, type Row } from "@/lib/data";
import { CrudModule } from "@/components/app/Crud";
import { Badge, Modal } from "@/components/ui";
import { FilePicker, useNames } from "./shared";
import { cx, fmtDate } from "@/lib/utils";
import { DOC_CATEGORIES } from "@/lib/constants";

const size = (b?: number | null) => (!b ? "No file" : b > 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`);

export function DocumentsModule({ projectId }: { projectId?: string }) {
  const { data, profile, signedUrl, notify } = useApp();
  const names = useNames();
  const [folder, setFolder] = useState("All");
  const [preview, setPreview] = useState<{ url: string; mime: string; name: string } | null>(null);
  const [detail, setDetail] = useState<Row | null>(null);
  const scoped = useMemo(() => data.documents.filter((d) => !projectId || d.project_id === projectId), [data.documents, projectId]);
  const folders = useMemo(() => ["All", ...[...new Set(scoped.map((d) => d.folder))].sort()], [scoped]);
  const rows = folder === "All" ? scoped : scoped.filter((d) => d.folder === folder);

  const open = async (r: Row, mode: "download" | "preview") => {
    if (!r.storage_path) { notify("bad", "This record has no file attached. Edit it to upload one."); return; }
    const url = await signedUrl(r.storage_path);
    if (!url) return;
    if (mode === "preview" && (r.mime_type?.startsWith("image/") || r.mime_type === "application/pdf")) setPreview({ url, mime: r.mime_type, name: r.name });
    else { const a = document.createElement("a"); a.href = url; a.download = r.name; a.target = "_blank"; a.click(); }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
      <aside className="card h-fit p-3">
        <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wide text-muted">Folders</p>
        <ul className="flex gap-1 overflow-x-auto lg:block lg:space-y-0.5">
          {folders.map((f) => (
            <li key={f} className="shrink-0"><button onClick={() => setFolder(f)} className={cx("flex w-full items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium", folder === f ? "bg-brand-soft text-brand-dark" : "text-ink hover:bg-paper")}>
              {folder === f ? <FolderOpen size={16} /> : <Folder size={16} />}{f}<span className="ml-auto text-xs text-muted">{f === "All" ? scoped.length : scoped.filter((d) => d.folder === f).length}</span></button></li>
          ))}
        </ul>
      </aside>
      <div className="min-w-0">
        <CrudModule
          table="documents" noun="Document" rows={rows} searchKeys={["name", "description", "folder", "uploaded_by"]}
          fixed={projectId ? { project_id: projectId } : undefined} exportName="documents" defaultSort={{ key: "created_at", dir: "desc" }}
          fields={[
            { key: "name", label: "Document name", type: "text", required: true, full: true },
            { key: "category", label: "Category", type: "select", options: DOC_CATEGORIES, required: true },
            { key: "folder", label: "Folder (type a new name to create one)", type: "text", required: true },
            { key: "project_id", label: "Project", type: "project" },
            { key: "description", label: "Description", type: "textarea" },
            { key: "storage_path", label: "Path", type: "text", hidden: true },
            { key: "file_size", label: "Size", type: "number", hidden: true },
            { key: "mime_type", label: "Type", type: "text", hidden: true },
            { key: "uploaded_by", label: "Uploaded by", type: "text", hidden: true },
          ]}
          defaults={{ category: "General Documents", folder: folder === "All" ? "General" : folder }}
          beforeSave={(v) => ({ ...v, uploaded_by: v.uploaded_by || profile?.full_name })}
          formExtra={(v, set) => <FilePicker label="File (up to 25 MB)" current={v.storage_path} onUploaded={(path, f) => set({ storage_path: path, file_size: f.size, mime_type: f.type, name: v.name || f.name })} />}
          filters={[{ key: "category", label: "Category", options: DOC_CATEGORIES }, ...(projectId ? [] : [{ key: "project_id", label: "Project", options: data.projects.map((p) => ({ value: p.id, label: p.name })) }])]}
          columns={[
            { key: "name", label: "Name", render: (r) => <button className="flex items-center gap-2 text-left font-semibold hover:text-brand" onClick={() => setDetail(r)}><FileText size={16} className="shrink-0 text-muted" />{r.name}</button> },
            { key: "category", label: "Category", render: (r) => <Badge tone="gray">{r.category}</Badge> },
            ...(projectId ? [] : [{ key: "project_id", label: "Project", render: (r: any) => names.project(r.project_id), hideMobile: true }]),
            { key: "uploaded_by", label: "Uploaded by", hideMobile: true },
            { key: "created_at", label: "Uploaded", render: (r) => fmtDate(r.created_at) },
            { key: "file_size", label: "Size", render: (r) => size(r.file_size), sortValue: (r) => Number(r.file_size || 0), hideMobile: true },
          ]}
          rowActions={(r) => <><button className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" onClick={() => open(r, "preview")} aria-label="Preview"><Eye size={15} /></button><button className="rounded-md p-1.5 text-muted hover:bg-line hover:text-ink" onClick={() => open(r, "download")} aria-label="Download"><Download size={15} /></button></>}
        />
      </div>
      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.name || "Preview"} wide>
        {preview && (preview.mime === "application/pdf" ? <iframe src={preview.url} className="h-[70vh] w-full rounded-md border border-line" title={preview.name} /> : <img src={preview.url} alt={preview.name} className="mx-auto max-h-[70vh] rounded-md" />)}
      </Modal>
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Document details" footer={<><button className="btn-outline" onClick={() => detail && open(detail, "preview")}>Preview</button><button className="btn-primary" onClick={() => detail && open(detail, "download")}><Download size={16} />Download</button></>}>
        {detail && <dl className="space-y-3 text-sm">{[["Name", detail.name], ["Category", detail.category], ["Folder", detail.folder], ["Project", names.project(detail.project_id)], ["Uploaded by", detail.uploaded_by || "Unknown"], ["Uploaded", fmtDate(detail.created_at)], ["Size", size(detail.file_size)], ["File type", detail.mime_type || "Not recorded"], ["Description", detail.description || "None"]].map(([k, v]) => <div key={k} className="grid grid-cols-3 gap-3"><dt className="text-muted">{k}</dt><dd className="col-span-2 font-medium">{v}</dd></div>)}</dl>}
      </Modal>
    </div>
  );
}
