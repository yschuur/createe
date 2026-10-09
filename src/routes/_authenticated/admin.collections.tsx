import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { MediaField } from "@/components/admin/MediaLibrary";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/collections")({
  head: () => ({ meta: [{ title: "Collecties | CREATEE beheer" }, { name: "description", content: "Collecties | CREATEE beheer. Beheer de CREATEE webshop." }, { property: "og:title", content: "Collecties | CREATEE beheer" }, { property: "og:description", content: "Collecties | CREATEE beheer. Beheer de CREATEE webshop." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: CollectionsAdmin,
});

import { BannerEditor } from "@/components/admin/BannerEditor";

function CollectionsAdmin() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["admin", "collections"],
    queryFn: async () => {
      const [c, cp, p, sp] = await Promise.all([
        supabase.from("collections").select("*").order("sort_order"),
        supabase.from("collection_products").select("*"),
        supabase.from("products").select("id, name, status, sport_id").order("name"),
        supabase.from("sports").select("id, name, slug").order("sort_order"),
      ]);
      return { collections: c.data ?? [], links: cp.data ?? [], products: p.data ?? [], sports: sp.data ?? [] };
    },
  });
  const refresh = () => qc.invalidateQueries();

  async function create() {
    const name = prompt("Naam van de collectie");
    if (!name?.trim()) return;
    const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { error } = await supabase.from("collections").insert({ name: name.trim(), slug, sort_order: data?.collections.length ?? 0, sport_ids: [] });
    if (!error) toast.info("Kies nu bij welke sport(en) deze collectie hoort.");
    if (error) toast.error(error.message); else refresh();
  }
  async function update(id: string, patch: Record<string, unknown>) {
    await supabase.from("collections").update(patch as never).eq("id", id); refresh();
  }
  async function remove(id: string) {
    if (!confirm("Collectie verwijderen? Producten blijven bestaan.")) return;
    await supabase.from("collections").delete().eq("id", id); refresh();
  }
  async function toggleProduct(cid: string, pid: string, on: boolean) {
    if (on) await supabase.from("collection_products").insert({ collection_id: cid, product_id: pid });
    else await supabase.from("collection_products").delete().eq("collection_id", cid).eq("product_id", pid);
    refresh();
  }
  const current = data?.collections.find((c) => c.id === editing);

  return (
    <AdminLayout title="Collecties" actions={<Button onClick={create}>Collectie toevoegen</Button>}>
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-sm bg-card p-4 text-sm">
        <span className="font-medium">Afbeeldingen onder de producten per sportpagina:</span>
        {data?.sports.map((s) => <span key={s.id} className="flex gap-2"><Button variant="outline" size="sm" asChild><Link to="/admin/layouts/$slug" params={{ slug: s.slug }}>{s.name}: indeling</Link></Button><BannerEditor slug={s.slug} name={s.name} /></span>)}
        <span className="text-xs text-muted-foreground">Een collectie met eigen afbeeldingen toont die; anders die van de sport.</span>
      </div>
      <div className="space-y-3">
        {data?.collections.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center gap-4 rounded-sm bg-card p-4">
            <div className="min-w-48 flex-1 space-y-2">
              <Input defaultValue={c.name} onBlur={(e) => e.target.value !== c.name && update(c.id, { name: e.target.value })} className="font-semibold" />
              <CollectionDescription value={c.description ?? ""} onSave={(v) => update(c.id, { description: v || null })} />
              <MediaField value={c.image_url ?? ""} onChange={(v) => update(c.id, { image_url: v || null })} placeholder="Collectiefoto (link)" />
              <div className="flex flex-wrap items-center gap-3 text-sm"><span className="font-medium">Sport:</span>{data.sports.map((s) => <label key={s.id} className="flex items-center gap-1"><input type="checkbox" checked={c.sport_ids.includes(s.id)} onChange={(e) => update(c.id, { sport_ids: e.target.checked ? [...c.sport_ids, s.id] : c.sport_ids.filter((x) => x !== s.id) })} />{s.name}</label>)}{c.sport_ids.length === 0 && <span className="text-destructive">Kies minstens één sport</span>}</div>
            </div>
            <p className="text-sm">{data.links.filter((l) => l.collection_id === c.id).length} producten</p>
            <label className="flex items-center gap-2 text-sm">Zichtbaar <Switch checked={c.published} onCheckedChange={(v) => update(c.id, { published: v })} /></label>
            <Button variant="outline" size="sm" onClick={() => setEditing(c.id)}>Producten</Button>
            <Button variant="outline" size="sm" asChild><Link to="/admin/layouts/$slug" params={{ slug: c.slug }}>Indeling</Link></Button>
            <BannerEditor slug={c.slug} name={c.name} />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(c.id)}>Verwijder</Button>
          </div>
        ))}
      </div>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Producten in {current?.name}</DialogTitle></DialogHeader>
          {data?.products.filter((p) => p.sport_id && current?.sport_ids.includes(p.sport_id)).map((p) => {
            const on = data.links.some((l) => l.collection_id === editing && l.product_id === p.id);
            return (
              <label key={p.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={on} onChange={(e) => toggleProduct(editing!, p.id, e.target.checked)} />
                {p.name} <span className="text-xs text-muted-foreground">({p.status})</span>
              </label>
            );
          })}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function CollectionDescription({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return <div className="space-y-1">
    <RichTextEditor minHeight={60} value={v} onChange={setV} placeholder="Omschrijving" />
    {v !== value && <Button size="sm" onClick={() => onSave(v)}>Omschrijving opslaan</Button>}
  </div>;
}
