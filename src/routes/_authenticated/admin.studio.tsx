import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Star, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { colorKey, studioProducts, studioQuery, type StudioSettings } from "@/lib/studio";

export const Route = createFileRoute("/_authenticated/admin/studio")({
  head: () => ({ meta: [{ title: "Design Studio — CREATEE beheer" }, { name: "description", content: "Beheer scorecard-reviews en kleurfoto's van de Design Studio." }, { property: "og:title", content: "Design Studio — CREATEE beheer" }, { property: "og:description", content: "Beheer scorecard-reviews en kleurfoto's." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: StudioAdmin,
});

function ImagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("studio-assets").upload(path, file, { contentType: file.type });
    if (error) { setUploading(false); toast.error("Upload mislukt: " + error.message); return; }
    // Lange geldigheid zodat de link ook voor bezoekers blijft werken.
    const { data, error: signError } = await supabase.storage.from("studio-assets").createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    setUploading(false);
    if (signError || !data) { toast.error("Link maken mislukt"); return; }
    onChange(data.signedUrl);
    toast.success("Foto geüpload");
  }

  return <div className="space-y-2">
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Link naar foto (https://…)" />
      <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
        <Upload /> {uploading ? "Uploaden…" : "Upload"}
      </Button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
    </div>
  </div>;
}

function StudioAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(studioQuery());
  const [s, setS] = useState<StudioSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && !s) setS(structuredClone(data)); }, [data, s]);
  if (!s) return <AdminLayout title="Design Studio"><p>Laden…</p></AdminLayout>;
  const upd = (fn: (d: StudioSettings) => void) => { const d = structuredClone(s); fn(d); setS(d); };

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "studio", value: s, updated_at: new Date().toISOString() } as never);
    setBusy(false);
    if (error) { toast.error("Opslaan mislukt: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["site-settings", "studio"] });
    toast.success("Design Studio opgeslagen");
  }

  return <AdminLayout title="Design Studio" actions={<Button onClick={save} disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</Button>}>
    <section className="rounded-sm bg-card p-5">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Scorecard-reviews</h2><p className="text-sm text-muted-foreground">Klantreviews met foto die op de Design Studio-pagina staan.</p></div>
        <Button variant="outline" onClick={() => upd((d) => { d.reviews.push({ id: crypto.randomUUID(), image: "", name: "", text: "", rating: 5 }); })}><Plus /> Review</Button></div>
      <div className="space-y-4">{s.reviews.map((r, i) => <div key={r.id} className="grid gap-4 rounded-sm border p-4 md:grid-cols-[120px_1fr]">
        <div className="aspect-square overflow-hidden rounded-sm bg-muted">{r.image && <img src={r.image} alt="" className="size-full object-cover" />}</div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input value={r.name} onChange={(e) => upd((d) => { d.reviews[i]!.name = e.target.value; })} placeholder="Naam klant / team (optioneel)" className="max-w-xs" />
            <div className="flex">{[1,2,3,4,5].map((n) => <button key={n} type="button" aria-label={`${n} sterren`} onClick={() => upd((d) => { d.reviews[i]!.rating = n; })}><Star className={`size-5 ${n <= r.rating ? "fill-primary text-primary" : "text-muted-foreground"}`} /></button>)}</div>
            <div className="ml-auto flex gap-1">
              <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => upd((d) => { [d.reviews[i-1], d.reviews[i]] = [d.reviews[i]!, d.reviews[i-1]!]; })}><ArrowUp /></Button>
              <Button size="icon" variant="ghost" disabled={i === s.reviews.length - 1} onClick={() => upd((d) => { [d.reviews[i+1], d.reviews[i]] = [d.reviews[i]!, d.reviews[i+1]!]; })}><ArrowDown /></Button>
              <Button size="icon" variant="ghost" onClick={() => upd((d) => { d.reviews.splice(i, 1); })}><Trash2 /></Button>
            </div>
          </div>
          <Textarea value={r.text} onChange={(e) => upd((d) => { d.reviews[i]!.text = e.target.value; })} placeholder="Reviewtekst (optioneel)" rows={2} maxLength={500} />
          <ImagePicker value={r.image} options={library} onChange={(v) => upd((d) => { d.reviews[i]!.image = v; })} />
        </div>
      </div>)}</div>
    </section>

    <section className="mt-6 rounded-sm bg-card p-5">
      <h2 className="text-lg font-bold">Foto per kleur</h2>
      <p className="mb-4 text-sm text-muted-foreground">Kies welke foto in de configurator verschijnt als iemand deze kleur kiest. Leeg = standaard productfoto.</p>
      <div className="space-y-6">{studioProducts.map((p) => <div key={p.name}><h3 className="mb-3 font-semibold">{p.name}</h3>
        <div className="grid gap-4 md:grid-cols-2">{p.colors.map((c) => { const k = colorKey(p.name, c.name); const v = s.color_images[k] ?? ""; return <div key={k} className="flex gap-3 rounded-sm border p-3">
          <div className="relative size-20 shrink-0 overflow-hidden rounded-sm bg-muted"><img src={v || p.image} alt="" className="size-full object-cover" /><span className="absolute bottom-1 left-1 size-4 rounded-full border border-border" style={{ background: c.hex }} /></div>
          <div className="min-w-0 flex-1"><p className="mb-2 text-sm font-medium">{c.name}</p><ImagePicker value={v} options={library} onChange={(nv) => upd((d) => { if (nv) d.color_images[k] = nv; else delete d.color_images[k]; })} /></div>
        </div>; })}</div></div>)}</div>
    </section>
  </AdminLayout>;
}
