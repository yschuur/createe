import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaField } from "@/components/admin/MediaLibrary";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { homepageQuery, type HomepageSettings, type HeroSide } from "@/lib/site-settings";

export const Route = createFileRoute("/_authenticated/admin/homepage")({
  head: () => ({ meta: [{ title: "Homepage — CREATEE beheer" }, { name: "description", content: "Pas de CREATEE homepage aan." }, { property: "og:title", content: "Homepage — CREATEE beheer" }, { property: "og:description", content: "Pas de CREATEE homepage aan." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: HomepageAdmin,
});

function HomepageAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(homepageQuery());
  const [s, setS] = useState<HomepageSettings | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && !s) setS(data); }, [data, s]);
  if (!s) return <AdminLayout title="Homepage"><p>Laden…</p></AdminLayout>;
  const set = (patch: Partial<HomepageSettings>) => setS({ ...s, ...patch });
  async function save() {
    setBusy(true);
    const value = { ...s, featured_slugs: s!.featured_slugs.map(x => x.trim()).filter(Boolean) };
    const { error } = await supabase.from("site_settings").upsert({ key: "homepage", value, updated_at: new Date().toISOString() } as never);
    setBusy(false);
    if (error) { toast.error("Opslaan mislukt: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    toast.success("Homepage opgeslagen");
  }
  const side = (key: "golf" | "padel", title: string) => {
    const v: HeroSide = s[key];
    return <div className="space-y-3 rounded-sm border border-border p-4">
      <p className="font-semibold">{title}</p>
      <div><Label>Knoptekst</Label><Input value={v.label} onChange={e => set({ [key]: { ...v, label: e.target.value } } as Partial<HomepageSettings>)} /></div>
      <div><Label>Link</Label><Input value={v.link} onChange={e => set({ [key]: { ...v, link: e.target.value } } as Partial<HomepageSettings>)} /></div>
      <label className="flex items-center gap-3 text-sm"><Switch checked={v.show_video} onCheckedChange={c => set({ [key]: { ...v, show_video: c } } as Partial<HomepageSettings>)} />Video tonen (uit = foto)</label>
      <div><Label>Video (leeg = standaard)</Label><MediaField kind="video" value={v.video_url ?? ""} onChange={u => set({ [key]: { ...v, video_url: u } } as Partial<HomepageSettings>)} /></div>
      <div><Label>Foto (leeg = standaard)</Label><MediaField value={v.image_url ?? ""} onChange={u => set({ [key]: { ...v, image_url: u } } as Partial<HomepageSettings>)} /></div>
    </div>;
  };
  return <AdminLayout title="Homepage" actions={<Button onClick={save} disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</Button>}>
    <div className="space-y-8">
      <section className="rounded-sm bg-card p-6">
        <h2 className="mb-1 text-lg font-semibold">Aankondigingsbalk</h2>
        <p className="mb-4 text-sm text-muted-foreground">Bovenaan elke pagina. Laat de link leeg voor gewone tekst.</p>
        <div className="space-y-2">
          {s.announcements.map((a, i) => <div key={i} className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
            <Input aria-label="Tekst" value={a.text} onChange={e => set({ announcements: s.announcements.map((x, j) => j === i ? { ...x, text: e.target.value } : x) })} />
            <Input aria-label="Link" placeholder="/design-studio" value={a.link} onChange={e => set({ announcements: s.announcements.map((x, j) => j === i ? { ...x, link: e.target.value } : x) })} />
            <Button variant="ghost" size="icon" aria-label="Verwijderen" onClick={() => set({ announcements: s.announcements.filter((_, j) => j !== i) })}><Trash2 /></Button>
          </div>)}
          <Button variant="outline" size="sm" onClick={() => set({ announcements: [...s.announcements, { text: "", link: "" }] })}><Plus /> Regel toevoegen</Button>
        </div>
      </section>
      <section className="rounded-sm bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Header</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {side("golf", "Linkerkant (golf)")}
          <div className="space-y-3 rounded-sm border border-border p-4">
            <p className="font-semibold">Middelste knop</p>
            <div><Label>Knoptekst (leeg = verbergen)</Label><Input value={s.studio_button.label} onChange={e => set({ studio_button: { ...s.studio_button, label: e.target.value } })} /></div>
            <div><Label>Link</Label><Input value={s.studio_button.link} onChange={e => set({ studio_button: { ...s.studio_button, link: e.target.value } })} /></div>
          </div>
          {side("padel", "Rechterkant (padel)")}
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm"><Switch checked={s.show_ratings} onCheckedChange={c => set({ show_ratings: c })} />Google/Trustpilot-balk onder de header tonen</label>
      </section>
      <section className="rounded-sm bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Productcarrousel</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div><Label>Titel boven carrousel (optioneel)</Label><Input value={s.carousel_title} onChange={e => set({ carousel_title: e.target.value })} /></div>
          <div><Label>Linktekst onder carrousel</Label><Input value={s.collection_link_label} onChange={e => set({ collection_link_label: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Uitgelichte producten eerst (productlinks, één per regel)</Label>
            <textarea className="mt-1 min-h-32 w-full rounded-sm border border-input bg-background p-2 text-sm" value={s.featured_slugs.join("\n")} onChange={e => set({ featured_slugs: e.target.value.split("\n") })} /></div>
        </div>
      </section>
    </div>
  </AdminLayout>;
}
