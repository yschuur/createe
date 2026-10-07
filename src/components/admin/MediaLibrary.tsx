import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Film, Images, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export type MediaKind = "image" | "video";
export type MediaAsset = { id: string; url: string; storage_path: string | null; kind: string; name: string | null; created_at: string };

export const mediaQuery = () => ({
  queryKey: ["media-assets"],
  queryFn: async () => {
    const { data, error } = await supabase.from("media_assets").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as MediaAsset[];
  },
});

export async function uploadMedia(file: File): Promise<MediaAsset> {
  const kind: MediaKind = file.type.startsWith("video/") ? "video" : "image";
  const ext = file.name.split(".").pop()?.toLowerCase() || (kind === "video" ? "mp4" : "jpg");
  const path = `media/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("studio-assets").upload(path, file, { contentType: file.type });
  if (error) throw error;
  // Openbare buckets zijn geblokkeerd; lange geldigheid zodat bezoekers het bestand blijven zien.
  const { data: signed, error: e2 } = await supabase.storage.from("studio-assets").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
  if (e2 || !signed) throw e2 ?? new Error("Link maken mislukt");
  const { data, error: e3 } = await supabase.from("media_assets").insert({ url: signed.signedUrl, storage_path: path, kind, name: file.name, mime_type: file.type, size_bytes: file.size }).select().single();
  if (e3) throw e3;
  return data as MediaAsset;
}

export function MediaThumb({ a, className = "" }: { a: Pick<MediaAsset, "url" | "kind" | "name">; className?: string }) {
  return a.kind === "video"
    ? <video src={a.url} muted playsInline preload="metadata" className={`h-full w-full object-cover ${className}`} />
    : <img src={a.url} alt={a.name ?? ""} loading="lazy" className={`h-full w-full object-cover ${className}`} />;
}

export function MediaGrid({ kind, onPick, selected, manage }: { kind?: MediaKind | undefined; onPick?: ((a: MediaAsset) => void) | undefined; selected?: string | undefined; manage?: boolean }) {
  const qc = useQueryClient();
  const { data = [], isLoading } = useQuery(mediaQuery());
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | MediaKind>(kind ?? "all");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const items = data.filter((a) => (filter === "all" || a.kind === filter) && (!q || (a.name ?? "").toLowerCase().includes(q.toLowerCase())));

  async function onFiles(files: File[]) {
    setBusy(true);
    let last: MediaAsset | null = null;
    for (const f of files) {
      try { last = await uploadMedia(f); } catch (e) { toast.error(`${f.name}: ${(e as Error).message}`); }
    }
    setBusy(false);
    await qc.invalidateQueries({ queryKey: ["media-assets"] });
    if (last) { toast.success("Toegevoegd aan bibliotheek"); if (onPick && files.length === 1) onPick(last); }
  }
  async function remove(a: MediaAsset) {
    if (!confirm("Verwijderen uit de bibliotheek? Plekken die dit bestand gebruiken tonen het dan mogelijk niet meer.")) return;
    if (a.storage_path?.startsWith("media/")) await supabase.storage.from("studio-assets").remove([a.storage_path]);
    const { error } = await supabase.from("media_assets").delete().eq("id", a.id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["media-assets"] });
  }

  const accept = kind === "image" ? "image/*" : kind === "video" ? "video/*" : "image/*,video/*";
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <Input className="max-w-xs" placeholder="Zoeken op naam…" value={q} onChange={(e) => setQ(e.target.value)} />
      {!kind && <div className="flex gap-1">{(["all", "image", "video"] as const).map((f) => <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} onClick={() => setFilter(f)}>{f === "all" ? "Alles" : f === "image" ? "Foto's" : "Video's"}</Button>)}</div>}
      <Button className="ml-auto" disabled={busy} onClick={() => fileRef.current?.click()}><Upload /> {busy ? "Uploaden…" : "Uploaden"}</Button>
      <input ref={fileRef} type="file" multiple accept={accept} className="hidden" onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; if (f.length) onFiles(f); }} />
    </div>
    <p className="text-xs text-muted-foreground">Max. 50 MB per bestand. Je kunt ook bestanden hierheen slepen.</p>
    <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = Array.from(e.dataTransfer.files); if (f.length) onFiles(f); }}
      className="grid min-h-40 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {isLoading && <p className="text-sm text-muted-foreground">Laden…</p>}
      {!isLoading && items.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nog geen bestanden.</p>}
      {items.map((a) => <div key={a.id} className={`group relative overflow-hidden rounded-sm border bg-muted ${selected === a.url ? "border-primary ring-2 ring-primary" : "border-border"}`}>
        <button type="button" className="block aspect-square w-full" onClick={() => onPick?.(a)} disabled={!onPick} title={a.name ?? ""}>
          <MediaThumb a={a} />
          {a.kind === "video" && <Film className="absolute left-2 top-2 size-4 text-background drop-shadow" />}
          {selected === a.url && <Check className="absolute right-2 top-2 size-5 rounded-full bg-primary p-0.5 text-primary-foreground" />}
        </button>
        <p className="truncate px-2 py-1 text-xs">{a.name}</p>
        {manage && <div className="absolute right-1 top-1 hidden gap-1 group-hover:flex">
          <Button size="icon" variant="secondary" className="size-7" aria-label="Link kopiëren" onClick={() => { navigator.clipboard.writeText(a.url); toast.success("Link gekopieerd"); }}><Images className="size-3" /></Button>
          <Button size="icon" variant="destructive" className="size-7" aria-label="Verwijderen" onClick={() => remove(a)}><Trash2 className="size-3" /></Button>
        </div>}
      </div>)}
    </div>
  </div>;
}

export function MediaLibraryDialog({ open, onOpenChange, kind, selected, onPick }: { open: boolean; onOpenChange: (o: boolean) => void; kind?: MediaKind | undefined; selected?: string | undefined; onPick: (a: MediaAsset) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
      <DialogHeader><DialogTitle>Mediabibliotheek</DialogTitle></DialogHeader>
      <MediaGrid kind={kind} selected={selected} onPick={(a) => { onPick(a); onOpenChange(false); }} />
    </DialogContent>
  </Dialog>;
}

/** Veld voor één foto/video: kiezen uit bibliotheek of een link plakken. */
export function MediaField({ value, onChange, kind = "image", placeholder }: { value: string; onChange: (v: string) => void; kind?: MediaKind; placeholder?: string }) {
  const [open, setOpen] = useState(false);
  return <div className="flex items-center gap-2">
    {value && <div className="size-10 shrink-0 overflow-hidden rounded-sm border border-border bg-muted"><MediaThumb a={{ url: value, kind, name: "" }} /></div>}
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder ?? (kind === "video" ? "Link naar video (https://…)" : "Link naar foto (https://…)")} />
    <Button type="button" variant="outline" onClick={() => setOpen(true)}><Images /> Bibliotheek</Button>
    <MediaLibraryDialog open={open} onOpenChange={setOpen} kind={kind} selected={value} onPick={(a) => onChange(a.url)} />
  </div>;
}
