import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Copy, Eye, EyeOff, GripVertical, Monitor, Plus, Smartphone, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MediaField } from "@/components/admin/MediaLibrary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CollectionSections } from "@/components/shop/CollectionSections";
import { arrangeMixed, LAYOUT_LABELS, layoutsQuery, MIXED_LAYOUTS, newSection, saveLayouts, SECTION_TYPES, type Section, type SectionItem, type SectionType } from "@/lib/collection-layout";
import { galleryImages } from "@/lib/product-gallery";
import { imgUrl, type ProductWithRelations } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/layouts/$slug")({
  head: () => ({ meta: [{ title: "Collectie-indeling | CREATEE beheer" }, { name: "description", content: "Stel de secties van een collectiepagina samen." }, { property: "og:title", content: "Collectie-indeling | CREATEE beheer" }, { property: "og:description", content: "Stel de secties van een collectiepagina samen." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: LayoutEditor,
});

function move<T>(list: T[], from: number, to: number) { const c = [...list]; const [x] = c.splice(from, 1); c.splice(to, 0, x!); return c; }

function LayoutEditor() {
  const { slug } = Route.useParams();
  const qc = useQueryClient();
  const { data: map } = useQuery(layoutsQuery());
  const { data: meta } = useQuery({
    queryKey: ["admin", "layout-target", slug],
    queryFn: async () => {
      const [sp, co] = await Promise.all([supabase.from("sports").select("id, name, slug").eq("slug", slug).maybeSingle(), supabase.from("collections").select("id, name, slug, sport_ids").eq("slug", slug).maybeSingle()]);
      const sportIds = sp.data ? [sp.data.id] : co.data?.sport_ids ?? [];
      const { data: products } = await supabase.from("products").select("*, product_variants(*), product_images(*)").in("sport_id", sportIds.length ? sportIds : ["00000000-0000-0000-0000-000000000000"]).eq("is_service", false).order("sort_order");
      let ids: string[] | null = null;
      if (co.data) { const { data: l } = await supabase.from("collection_products").select("product_id, sort_order").eq("collection_id", co.data.id).order("sort_order"); ids = (l ?? []).map((x) => x.product_id); }
      return { name: sp.data?.name ?? co.data?.name ?? slug, products: (products ?? []) as ProductWithRelations[], collectionIds: ids };
    },
  });
  const [sections, setSections] = useState<Section[] | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [drag, setDrag] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => { if (map && sections === null) setSections(map[slug] ?? []); }, [map, slug, sections]);
  const list = sections ?? [];
  const current = list.find((s) => s.id === sel) ?? null;
  const patch = (id: string, p: Partial<Section>) => setSections(list.map((s) => (s.id === id ? ({ ...s, ...p } as Section) : s)));
  const products = meta?.products ?? [];
  const previewProducts = meta?.collectionIds ? meta.collectionIds.flatMap((id) => products.filter((p) => p.id === id && p.status === "active" && p.published)) : products.filter((p) => p.status === "active" && p.published);

  async function save() {
    const { error } = await saveLayouts({ ...(map ?? {}), [slug]: list });
    if (error) { toast.error(error.message); return; }
    toast.success("Indeling opgeslagen"); qc.invalidateQueries({ queryKey: ["site-settings", "collection_layouts"] });
  }
  function add(type: SectionType) { const s = newSection(type); setSections([...list, s]); setSel(s.id); setAdding(false); }

  return (
    <AdminLayout title={`Indeling: ${meta?.name ?? slug}`} actions={<div className="flex gap-2"><Button variant="outline" asChild><Link to="/admin/collections"><ArrowLeft /> Collecties</Link></Button><Button onClick={save}>Opslaan</Button></div>}>
      <p className="mb-4 text-sm text-muted-foreground">Zonder secties toont de pagina het gewone productraster. Banners bovenaan staan boven de filterbalk; de rest eronder. Verwijderen van een sectie verwijdert nooit producten.</p>
      <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-3">
          {list.map((s, i) => (
            <div key={s.id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag !== null && drag !== i) setSections(move(list, drag, i)); setDrag(null); }}
              className={`flex items-center gap-2 rounded-sm border bg-card p-2 text-sm ${sel === s.id ? "border-primary ring-1 ring-primary" : "border-border"} ${s.hidden ? "opacity-50" : ""}`}>
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
              <button type="button" className="min-w-0 flex-1 truncate text-left font-medium" onClick={() => setSel(s.id)}>{SECTION_TYPES.find((t) => t.type === s.type)?.label}{"items" in s && s.type !== "regular" ? ` (${s.items.length})` : ""}{s.type === "regular" ? (s.source === "auto" ? " (automatisch)" : ` (${s.items.length})`) : ""}</button>
              <Button size="icon" variant="ghost" className="size-7" aria-label={s.hidden ? "Tonen" : "Verbergen"} onClick={() => patch(s.id, { hidden: !s.hidden })}>{s.hidden ? <EyeOff /> : <Eye />}</Button>
              <Button size="icon" variant="ghost" className="size-7" aria-label="Dupliceren" onClick={() => { const c = { ...structuredClone(s), id: crypto.randomUUID() }; setSections([...list.slice(0, i + 1), c, ...list.slice(i + 1)]); }}><Copy /></Button>
              <Button size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Verwijderen" onClick={() => { if (confirm("Sectie verwijderen?")) { setSections(list.filter((x) => x.id !== s.id)); if (sel === s.id) setSel(null); } }}><Trash2 /></Button>
            </div>
          ))}
          <Button variant="outline" className="w-full" onClick={() => setAdding(true)}><Plus /> Sectie toevoegen</Button>
          {current && <div className="rounded-sm border border-border bg-card p-4"><SectionSettings s={current} products={products} onChange={(p) => patch(current.id, p)} /></div>}
        </div>
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm"><span className="font-medium">Voorbeeld</span>
            <Button size="sm" variant={device === "desktop" ? "default" : "outline"} onClick={() => setDevice("desktop")}><Monitor /> Desktop</Button>
            <Button size="sm" variant={device === "mobile" ? "default" : "outline"} onClick={() => setDevice("mobile")}><Smartphone /> Mobiel</Button>
          </div>
          <div className="storefront overflow-hidden rounded-sm border border-border bg-background">
            <div className={`@container mx-auto max-h-[75vh] overflow-y-auto py-2 ${device === "mobile" ? "w-[390px]" : "w-full"}`}>
              {list.filter((s) => !s.hidden).length ? <CollectionSections sections={list} products={previewProducts} alt={meta?.name ?? ""} /> : <p className="p-10 text-center text-sm text-muted-foreground">Nog geen secties: de pagina toont het gewone productraster.</p>}
            </div>
          </div>
        </div>
      </div>
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent><DialogHeader><DialogTitle>Sectie toevoegen</DialogTitle></DialogHeader>
          <div className="grid gap-2">{SECTION_TYPES.map((t) => <button key={t.type} type="button" onClick={() => add(t.type)} className="rounded-sm border border-border p-3 text-left hover:border-primary"><p className="font-medium">{t.label}</p><p className="text-xs text-muted-foreground">{t.hint}</p></button>)}</div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function SectionSettings({ s, products, onChange }: { s: Section; products: ProductWithRelations[]; onChange: (p: Partial<Section>) => void }) {
  if (s.type === "banner") return <div className="space-y-3 text-sm">
    <p className="font-semibold">Banner</p>
    <label className="block space-y-1"><span>Desktopafbeelding</span><MediaField value={s.desktop} onChange={(v) => onChange({ desktop: v })} /></label>
    <label className="block space-y-1"><span>Mobiele afbeelding (optioneel)</span><MediaField value={s.mobile} onChange={(v) => onChange({ mobile: v })} /></label>
    <p className="text-xs text-muted-foreground">Zonder mobiele afbeelding wordt de desktopafbeelding gebruikt. De afbeelding houdt haar eigen verhouding.</p>
  </div>;
  const showRow = <div className="grid grid-cols-2 gap-2">{(["name", "material", "price", "colors"] as const).map((k) => <label key={k} className="flex items-center gap-2"><Switch checked={s.show[k]} onCheckedChange={(v) => onChange({ show: { ...s.show, [k]: v } })} />{{ name: "Naam", material: "Materiaal", price: "Prijs", colors: "Kleuren" }[k]}</label>)}</div>;
  const warning = s.type === "mixed" ? arrangeMixed(s.layout, s.items).warning : null;
  const manual = !(s.type === "regular" && s.source === "auto");
  return <div className="space-y-3 text-sm">
    <p className="font-semibold">{SECTION_TYPES.find((t) => t.type === s.type)?.label}</p>
    {s.type === "mixed" && <label className="block space-y-1"><span>Layout</span>
      <select className="w-full rounded-sm border border-border bg-background px-2 py-1.5" value={s.layout} onChange={(e) => onChange({ layout: e.target.value as Section & { type: "mixed" } extends { layout: infer L } ? L : never })}>{MIXED_LAYOUTS.map((l) => <option key={l} value={l}>{LAYOUT_LABELS[l]}</option>)}</select></label>}
    {s.type === "regular" && <div className="flex gap-2"><Button size="sm" variant={s.source === "auto" ? "default" : "outline"} onClick={() => onChange({ source: "auto" })}>Automatisch uit collectie</Button><Button size="sm" variant={s.source === "manual" ? "default" : "outline"} onClick={() => onChange({ source: "manual" })}>Zelf kiezen</Button></div>}
    {s.type === "regular" && s.source === "auto" && <label className="block space-y-1"><span>Aantal producten (0 = alle overige)</span><Input type="number" min={0} value={s.limit} onChange={(e) => onChange({ limit: Math.max(0, Number(e.target.value) || 0) })} /></label>}
    {(s.type !== "mixed" || s.layout === "small" || s.layout === "large") && <label className="block space-y-1"><span>Kolommen (desktop)</span><Input type="number" min={1} max={s.type === "featured" ? 4 : 6} value={s.columns} onChange={(e) => onChange({ columns: Math.max(1, Math.min(s.type === "featured" ? 4 : 6, Number(e.target.value) || 1)) })} /></label>}
    {showRow}
    {warning && <p className="rounded-sm bg-accent/20 p-2 text-xs">{warning} De site laat geen lege plekken zien.</p>}
    {manual && <ItemsEditor items={s.items} products={products} withSize={s.type === "mixed"} onChange={(items) => onChange({ items })} />}
  </div>;
}

function thumb(p: ProductWithRelations | undefined) { const im = p ? galleryImages(p)[0] : undefined; return im ? imgUrl(im.url, 120) : ""; }

function ItemsEditor({ items, products, withSize, onChange }: { items: SectionItem[]; products: ProductWithRelations[]; withSize: boolean; onChange: (i: SectionItem[]) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [pick, setPick] = useState<string[]>([]);
  const [drag, setDrag] = useState<number | null>(null);
  const set = (i: number, p: Partial<SectionItem>) => onChange(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const byId = new Map(products.map((p) => [p.id, p]));
  return <div className="space-y-2">
    <p className="font-medium">Producten</p>
    {items.map((it, i) => { const p = byId.get(it.productId); return (
      <div key={it.productId} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag !== null && drag !== i) onChange(move(items, drag, i)); setDrag(null); }} className="space-y-2 rounded-sm border border-border p-2">
        <div className="flex items-center gap-2">
          <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" />
          <div className="size-9 shrink-0 overflow-hidden rounded-sm bg-muted">{thumb(p) && <img src={it.image || thumb(p)} alt="" className="h-full w-full object-cover" />}</div>
          <span className="min-w-0 flex-1 truncate">{p?.name ?? "Onbekend product"}{p && (p.status !== "active" || !p.published) ? " (niet zichtbaar)" : ""}</span>
          <Button size="icon" variant="ghost" className="size-7 text-destructive" aria-label="Uit sectie halen" onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash2 /></Button>
        </div>
        {withSize && <div className="flex gap-1"><Button size="sm" variant={it.size === "large" ? "default" : "outline"} onClick={() => set(i, { size: it.size === "large" ? undefined : "large" })}>Groot</Button><Button size="sm" variant={it.size === "small" ? "default" : "outline"} onClick={() => set(i, { size: it.size === "small" ? undefined : "small" })}>Klein</Button></div>}
        <Input value={it.label ?? ""} placeholder="Label, bijv. BESTSELLER (leeg = geen)" onChange={(e) => set(i, { label: e.target.value || undefined })} />
        <MediaField value={it.image ?? ""} onChange={(v) => set(i, { image: v || undefined })} placeholder="Andere kaartfoto (optioneel)" />
      </div>); })}
    <Button size="sm" variant="outline" onClick={() => { setPick([]); setOpen(true); }}><Plus /> Producten toevoegen</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>Producten toevoegen</DialogTitle></DialogHeader>
        <Input placeholder="Zoeken op naam…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="space-y-1">{products.filter((p) => !items.some((i) => i.productId === p.id) && p.name.toLowerCase().includes(q.toLowerCase())).map((p) => (
          <label key={p.id} className="flex items-center gap-2 rounded-sm p-1 text-sm hover:bg-muted">
            <input type="checkbox" checked={pick.includes(p.id)} onChange={(e) => setPick(e.target.checked ? [...pick, p.id] : pick.filter((x) => x !== p.id))} />
            <div className="size-9 shrink-0 overflow-hidden rounded-sm bg-muted">{thumb(p) && <img src={thumb(p)} alt="" className="h-full w-full object-cover" />}</div>
            <span className="truncate">{p.name}</span>
          </label>))}</div>
        <Button onClick={() => { onChange([...items, ...pick.map((productId) => ({ productId }))]); setOpen(false); }} disabled={!pick.length}>{pick.length} toevoegen</Button>
      </DialogContent>
    </Dialog>
  </div>;
}
