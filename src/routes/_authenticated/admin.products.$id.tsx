import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trash2, ArrowUp, ArrowDown, Plus, Images } from "lucide-react";
import { MediaLibraryDialog } from "@/components/admin/MediaLibrary";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { ProductPageEditor } from "@/components/admin/ProductPageEditor";
import { ProductGalleryEditor } from "@/components/admin/ProductGalleryEditor";
import { getGallery } from "@/lib/product-gallery";
import { getPage, type ProductPageContent } from "@/lib/product-page";
import { imgUrl, type Product, type ProductImage, type Variant } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  head: () => ({ meta: [{ title: "Product bewerken — CREATEE beheer" }, { name: "description", content: "Product bewerken — CREATEE beheer. Beheer de CREATEE webshop." }, { property: "og:title", content: "Product bewerken — CREATEE beheer" }, { property: "og:description", content: "Product bewerken — CREATEE beheer. Beheer de CREATEE webshop." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: EditProduct,
});

function EditProduct() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: async () => {
      const [p, v, i, c, cp, sp] = await Promise.all([
        supabase.from("products").select("*").eq("id", id).single(),
        supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("collections").select("id, name, sport_ids").order("sort_order"),
        supabase.from("collection_products").select("collection_id").eq("product_id", id),
        supabase.from("sports").select("id, name").order("sort_order"),
      ]);
      if (p.error) throw p.error;
      return { product: p.data, variants: v.data ?? [], images: i.data ?? [], collections: c.data ?? [], sports: sp.data ?? [], inCollections: (cp.data ?? []).map((x) => x.collection_id) };
    },
  });

  const [p, setP] = useState<Product | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [libOpen, setLibOpen] = useState(false);
  const [colls, setColls] = useState<string[]>([]);
  const [newImg, setNewImg] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) { setP(data.product); setVariants(data.variants); setImages(data.images); setColls(data.inCollections); }
  }, [data]);
  if (!p || !data) return <AdminLayout title="Product"><p>Laden…</p></AdminLayout>;

  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP({ ...p, [k]: v });
  const setV = (idx: number, patch: Partial<Variant>) => setVariants(variants.map((v, i) => (i === idx ? { ...v, ...patch } : v)));

  async function save() {
    if (!p || !data) return;
    setSaving(true);
    try {
      const { id: _i, created_at: _c, updated_at: _u, ...fields } = p;
      const { error } = await supabase.from("products").update(fields).eq("id", id);
      if (error) throw error;
      const existingIds = new Set(data.variants.map((v) => v.id));
      for (const v of variants) {
        const { created_at: _vc, updated_at: _vu, ...vf } = v;
        if (existingIds.has(v.id)) { const { error: e } = await supabase.from("product_variants").update(vf).eq("id", v.id); if (e) throw e; }
        else { const { id: _x, ...ins } = vf; const { error: e } = await supabase.from("product_variants").insert(ins); if (e) throw e; }
      }
      const removed = data.variants.filter((v) => !variants.some((x) => x.id === v.id)).map((v) => v.id);
      if (removed.length) await supabase.from("product_variants").delete().in("id", removed);
      for (const [i, im] of images.entries()) {
        const { error: imageError } = await supabase.from("product_images").update({ sort_order: i + 1, is_primary: i === 0, alt_text: im.alt_text, variant_id: im.variant_id }).eq("id", im.id);
        if (imageError) throw imageError;
      }
      await supabase.from("collection_products").delete().eq("product_id", id);
      if (colls.length) await supabase.from("collection_products").insert(colls.map((c) => ({ collection_id: c, product_id: id })));
      toast.success("Opgeslagen");
      qc.invalidateQueries();
      refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally { setSaving(false); }
  }

  async function addImage(url = newImg): Promise<void> {
    if (!/^https:\/\//.test(url)) { toast.error("Gebruik een https-link naar de afbeelding"); return; }
    const { data: im, error } = await supabase.from("product_images").insert({ product_id: id, url, source_url: url, sort_order: images.length + 1 }).select().single();
    if (error) { toast.error(error.message); return; }
    setImages([...images, im]); setNewImg("");
  }
  async function removeImage(imId: string) {
    await supabase.from("product_images").delete().eq("id", imId);
    setImages(images.filter((i) => i.id !== imId));
  }
  function move(i: number, d: number) {
    const arr = [...images]; const j = i + d; if (j < 0 || j >= arr.length) return;
    const a = arr[i], b = arr[j]; if (!a || !b) return; arr[i] = b; arr[j] = a; setImages(arr);
  }
  async function del() {
    if (!p || !confirm(`"${p.name}" definitief verwijderen?`)) return;
    await supabase.from("products").delete().eq("id", id);
    qc.invalidateQueries(); nav({ to: "/admin/products" });
  }
  function addVariant() {
    const last = variants[variants.length - 1];
    setVariants([...variants, {
      ...(last ?? {}), id: crypto.randomUUID(), product_id: id, sku: null, inventory_quantity: 0, original_inventory_qty: null,
      sort_order: variants.length, price: last?.price ?? 0,
    } as Variant]);
  }

  return (
    <AdminLayout title={p.name} actions={
      <div className="flex gap-2">
        {p.status !== "draft" && <a href={p.is_service ? "/design-studio" : `/products/${p.slug}`} target="_blank" rel="noreferrer"><Button variant="outline">Bekijk</Button></a>}
        <Button onClick={save} disabled={saving}>{saving ? "Opslaan…" : "Opslaan"}</Button>
      </div>
    }>
      <Link to="/admin/products" className="mb-4 inline-block text-sm underline">← Alle producten</Link>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <Box title="Algemeen">
            <div><Label>Naam</Label><Input value={p.name} onChange={(e) => set("name", e.target.value)} /></div>
            <div><Label>Omschrijving</Label><RichTextEditor minHeight={180} value={p.description_html ?? ""} onChange={(v) => set("description_html", v)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Producttype</Label><Input value={p.product_type ?? ""} onChange={(e) => set("product_type", e.target.value)} /></div>
              <div><Label>Merk</Label><Input value={p.vendor ?? ""} onChange={(e) => set("vendor", e.target.value)} /></div>
              <div><Label>Pasvorm</Label><Input value={p.fit ?? ""} onChange={(e) => set("fit", e.target.value)} /></div>
              <div><Label>Materiaal</Label><Input value={p.fabric ?? ""} onChange={(e) => set("fabric", e.target.value)} /></div>
            </div>
            <div><Label>Sport</Label><select className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={p.sport_id ?? ""} onChange={(e) => { const v = e.target.value || null; set("sport_id", v); setColls(colls.filter((cid) => data.collections.find((c) => c.id === cid)?.sport_ids.includes(v ?? ""))); }}><option value="">Geen sport (niet zichtbaar in een shop)</option>{data.sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><p className="mt-1 text-xs text-muted-foreground">Het product verschijnt alleen in de shop van deze sport. Nieuwe sporten maak je aan onder Sporten.</p></div>
            <div><Label>Tags (komma-gescheiden)</Label><Input value={p.tags.join(", ")} onChange={(e) => set("tags", e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} /></div>
          </Box>

          <Box title="Productpagina-teksten">
            <ProductPageEditor value={getPage(p)} onChange={(v: ProductPageContent) => set("metadata", { ...((p.metadata as object) ?? {}), page: v } as Product["metadata"])} />
          </Box>

          <Box title="Foto's per kleur">
            <ProductGalleryEditor images={images} variants={variants} value={getGallery(p.metadata)} onChange={(gallery) => set("metadata", { ...((p.metadata as object) ?? {}), gallery } as Product["metadata"])} />
          </Box>

          <Box title="Alle productafbeeldingen">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {images.map((im, i) => (
                <div key={im.id} className="space-y-1 rounded-sm border border-border p-2">
                  <img src={imgUrl(im.url, 300)} alt={im.alt_text ?? ""} className="aspect-[4/5] w-full rounded-sm object-cover" />
                  {i === 0 && <p className="text-xs font-medium text-primary">Hoofdafbeelding</p>}
                  <select className="w-full rounded-sm border border-input bg-background p-1 text-xs" value={im.variant_id ?? ""} onChange={(e) => setImages(images.map((x) => x.id === im.id ? { ...x, variant_id: e.target.value || null } : x))}>
                    <option value="">Geen variant</option>
                    {variants.map((v) => <option key={v.id} value={v.id}>{[v.option1_value, v.option2_value].filter(Boolean).join(" / ") || "Standaard"}</option>)}
                  </select>
                  <div className="flex justify-between">
                    <button onClick={() => move(i, -1)} aria-label="Omhoog"><ArrowUp className="h-4 w-4" /></button>
                    <button onClick={() => move(i, 1)} aria-label="Omlaag"><ArrowDown className="h-4 w-4" /></button>
                    <button onClick={() => removeImage(im.id)} aria-label="Verwijder"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2"><Input placeholder="https://… afbeeldingslink" value={newImg} onChange={(e) => setNewImg(e.target.value)} /><Button variant="outline" onClick={() => addImage()}>Toevoegen</Button><Button variant="outline" onClick={() => setLibOpen(true)}><Images /> Bibliotheek</Button></div>
            <MediaLibraryDialog open={libOpen} onOpenChange={setLibOpen} kind="image" onPick={(a) => addImage(a.url)} />
          </Box>

          <Box title={`Varianten (${variants.length})`}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground"><tr><th className="p-1">{variants[0]?.option1_name ?? "Optie 1"}</th><th className="p-1">{variants[0]?.option2_name ?? "Optie 2"}</th><th className="p-1">Prijs</th><th className="p-1">Van-prijs</th><th className="p-1">Voorraad</th><th className="p-1">SKU</th><th className="p-1">Actief</th><th></th></tr></thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={v.id} className="border-t border-border">
                      <td className="p-1"><Input className="h-8" value={v.option1_value ?? ""} onChange={(e) => setV(i, { option1_value: e.target.value || null, option1_name: v.option1_name ?? "Kleur", color: e.target.value || null })} /></td>
                      <td className="p-1"><Input className="h-8" value={v.option2_value ?? ""} onChange={(e) => setV(i, { option2_value: e.target.value || null, option2_name: v.option2_name ?? "Maat", size: e.target.value || null })} /></td>
                      <td className="p-1"><Input className="h-8 w-20" type="number" step="0.01" value={v.price} onChange={(e) => setV(i, { price: Number(e.target.value) })} /></td>
                      <td className="p-1"><Input className="h-8 w-20" type="number" step="0.01" value={v.compare_at_price ?? ""} onChange={(e) => setV(i, { compare_at_price: e.target.value ? Number(e.target.value) : null })} /></td>
                      <td className="p-1"><Input className="h-8 w-16" type="number" min={0} value={v.inventory_quantity} disabled={!v.track_inventory} onChange={(e) => setV(i, { inventory_quantity: Math.max(0, Math.trunc(Number(e.target.value))) })} /></td>
                      <td className="p-1"><Input className="h-8 w-24" value={v.sku ?? ""} onChange={(e) => setV(i, { sku: e.target.value || null })} /></td>
                      <td className="p-1"><Switch checked={v.active} onCheckedChange={(c) => setV(i, { active: c })} /></td>
                      <td className="p-1"><button onClick={() => setVariants(variants.filter((_, j) => j !== i))} aria-label="Verwijder variant"><Trash2 className="h-4 w-4 text-destructive" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button variant="outline" size="sm" onClick={addVariant}><Plus className="mr-1 h-4 w-4" /> Variant</Button>
          </Box>
        </div>

        <div className="space-y-6">
          <Box title="Zichtbaarheid">
            <div><Label>Status</Label>
              <select className="w-full rounded-sm border border-input bg-background p-2 text-sm" value={p.status} onChange={(e) => set("status", e.target.value)}>
                <option value="active">Actief — zichtbaar in shop</option><option value="draft">Concept — alleen in beheer</option>
                <option value="unlisted">Verborgen — alleen via directe link</option><option value="archived">Gearchiveerd</option>
              </select>
            </div>
            <Toggle label="Gepubliceerd" checked={p.published} onChange={(c) => set("published", c)} />
            <Toggle label="Uitgelicht" checked={p.featured} onChange={(c) => set("featured", c)} />
            <Toggle label="Dienst (geen voorraad)" checked={p.is_service} onChange={(c) => { set("is_service", c); setVariants(variants.map((v) => ({ ...v, track_inventory: !c }))); }} />
          </Box>
          <Box title="Collecties">
            {!p.sport_id && <p className="text-sm text-muted-foreground">Kies eerst een sport.</p>}
            {data.collections.filter((c) => p.sport_id && c.sport_ids.includes(p.sport_id)).map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={colls.includes(c.id)} onChange={(e) => setColls(e.target.checked ? [...colls, c.id] : colls.filter((x) => x !== c.id))} /> {c.name}
              </label>
            ))}
          </Box>
          <Box title="SEO">
            <div><Label>URL-handle</Label><Input value={p.slug} onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} /><p className="mt-1 text-xs text-muted-foreground">/products/{p.slug}</p></div>
            <div><Label>SEO-titel</Label><Input value={p.seo_title ?? ""} onChange={(e) => set("seo_title", e.target.value || null)} /></div>
            <div><Label>SEO-omschrijving</Label><Textarea rows={3} value={p.seo_description ?? ""} onChange={(e) => set("seo_description", e.target.value || null)} /></div>
          </Box>
          <Button variant="outline" className="w-full text-destructive" onClick={del}>Product verwijderen</Button>
        </div>
      </div>
    </AdminLayout>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="space-y-3 rounded-sm bg-card p-5"><h2 className="font-semibold">{title}</h2>{children}</div>;
}
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return <label className="flex items-center justify-between text-sm">{label}<Switch checked={checked} onCheckedChange={onChange} /></label>;
}
