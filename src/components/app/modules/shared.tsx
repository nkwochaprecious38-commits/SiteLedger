"use client";
import { useRef, useState } from "react";
import { Paperclip, Send, ImagePlus, X } from "lucide-react";
import { useApp } from "@/lib/data";
import { Avatar } from "@/components/ui";
import { timeAgo } from "@/lib/utils";

export function useNames() {
  const { data } = useApp();
  return {
    project: (id?: string | null) => data.projects.find((p) => p.id === id)?.name || "No project",
    member: (id?: string | null) => data.team_members.find((m) => m.id === id)?.name || "Unassigned",
  };
}

export function CommentsBox({ entityType, entityId }: { entityType: "task" | "issue"; entityId: string }) {
  const { data, create, profile, canWrite } = useApp();
  const [text, setText] = useState("");
  const list = data.comments.filter((c) => c.entity_type === entityType && c.entity_id === entityId).sort((a, b) => a.created_at.localeCompare(b.created_at));
  const add = async () => {
    if (!text.trim()) return;
    if (await create("comments", { entity_type: entityType, entity_id: entityId, author_name: profile?.full_name, body: text.trim() })) setText("");
  };
  return (
    <div className="sm:col-span-2">
      <label className="label">Comments</label>
      <div className="space-y-3 rounded-md border border-line p-3">
        {list.length === 0 && <p className="text-sm text-muted">No comments yet.</p>}
        {list.map((c) => (
          <div key={c.id} className="flex gap-3"><Avatar name={c.author_name} size={28} />
            <div><p className="text-xs"><span className="font-semibold">{c.author_name}</span> <span className="text-muted">{timeAgo(c.created_at)}</span></p><p className="text-sm">{c.body}</p></div></div>
        ))}
        {canWrite && <div className="flex gap-2"><input className="input" placeholder="Write a comment" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} /><button type="button" className="btn-dark" onClick={add} aria-label="Add comment"><Send size={15} /></button></div>}
      </div>
    </div>
  );
}

// Uploads one file to private storage and reports the stored path.
export function FilePicker({ label, accept, onUploaded, current }: { label: string; accept?: string; onUploaded: (path: string, file: File) => void; current?: string | null }) {
  const { upload, notify } = useApp();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const pick = async (f?: File | null) => {
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { notify("bad", "Files must be 25 MB or smaller"); return; }
    setBusy(true);
    const path = await upload(f, "files");
    if (path) { setName(f.name); onUploaded(path, f); }
    setBusy(false);
  };
  return (
    <div className="sm:col-span-2">
      <label className="label">{label}</label>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <button type="button" className="btn-outline w-full justify-start" disabled={busy} onClick={() => ref.current?.click()}>
        <Paperclip size={16} />{busy ? "Uploading" : name || (current ? "File attached: choose a different file" : "Choose a file")}
      </button>
    </div>
  );
}

export function PhotoPicker({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const { upload, signedUrl, notify } = useApp();
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    for (const f of Array.from(files)) {
      if (!f.type.startsWith("image/")) { notify("bad", `${f.name} is not an image`); continue; }
      const p = await upload(f, "photos");
      if (p) added.push(p);
    }
    onChange([...(photos || []), ...added]);
    setBusy(false);
  };
  return (
    <div className="sm:col-span-2">
      <label className="label">Site photographs</label>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => add(e.target.files)} />
      <div className="flex flex-wrap gap-2">
        {(photos || []).map((p) => (
          <span key={p} className="inline-flex items-center gap-1 rounded-md bg-paper px-2.5 py-1.5 text-xs">
            <button type="button" className="font-medium hover:underline" onClick={async () => { const u = await signedUrl(p); if (u) window.open(u, "_blank"); }}>{p.split("/").pop()?.replace(/^\d+_/, "")}</button>
            <button type="button" onClick={() => onChange(photos.filter((x) => x !== p))} aria-label="Remove photo"><X size={12} /></button>
          </span>
        ))}
        <button type="button" className="btn-outline btn-sm" disabled={busy} onClick={() => ref.current?.click()}><ImagePlus size={14} />{busy ? "Uploading" : "Add photos"}</button>
      </div>
    </div>
  );
}

export function SegToggle({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="inline-flex rounded-md border border-line bg-white p-0.5">
      {options.map((o) => <button key={o} onClick={() => onChange(o)} className={`rounded px-3 py-1.5 text-xs font-semibold ${value === o ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>{o}</button>)}
    </div>
  );
}
