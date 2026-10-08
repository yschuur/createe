import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BLANK_MODELS } from "@/lib/blank-stock";

export const Route = createFileRoute("/_authenticated/admin/products/bulk")({
  head: () => ({ meta: [{ title: "Bulk aanpassen — CREATEE beheer" }, { name: "description", content: "Pas meerdere producten tegelijk aan in de CREATEE webshop." }, { property: "og:title", content: "Bulk aanpassen — CREATEE beheer" }, { property: "og:description", content: "Pas meerdere producten tegelijk aan in de CREATEE webshop." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: BulkEdit,
});

type Kind = "text" | "number" | "bool" | "status" | "sport" | "blank" | "tags" | "price";
type FieldDef = { key: string; label: string; kind: Kind };
const FIELDS: FieldDef[] = [
  { key: "name", label: "Naam", kind: "text" },
  { key: "price", label: "Prijs (alle varianten)", kind: "price" },
  { key: "compare_at_price", label: "Van-prijs (alle varianten)", kind: "price" },
  { key: "status", label: "Status", kind: "status" },
  { key: "published", label: "Gepubliceerd", kind: "bool" },
  { key: "featured", label: "Uitgelicht", kind: "bool" },
  { key: "product_type", label: "Producttype", kind: "text" },
  { key: "vendor", label: "Merk", kind: "text" },
  { key: "fit", label: "Pasvorm", kind: "text" },
  { key: "fabric", label: "Materiaal", kind: "text" },
  { key: "sport_id", label: "Sport", kind: "sport" },
  { key: "blank_model", label: "Blanco model", kind: "blank" },
  { key: "tags", label: "Tags", kind: "tags" },
  { key: "sort_order", label: "Sorteervolgorde", kind: "number" },
  { key: "slug", label: "URL-handle", kind: "text" },
  { key: "seo_title", label: "SEO-titel", kind: "text" },
  { key: "seo_description", label: "SEO-omschrijving", kind: "text" },
  { key: "size_chart_image", label: "Maattabel-afbeelding (URL)", kind: "text" },
];

type Row = Record<string, unknown> & { id: string; name: string };

function BulkEdit() {
  const qc = useQueryClient();
  const { data, refetch } = useQuery({
    queryKey: ["admin", "products-bulk"],
    queryFn: async () => {
      const [p, s] = await Promise.all([
        supabase.from("products").select("*, product_variants(id, price, compare_at_price)").order("sort_order"),
        supabase.from("sports").select("id, name").order("sort_order"),
      ]);
      if (p.error) throw p.error;
      const rows: Row[] = p.data.map(({ product_variants: v, ...x }) => ({
        ...x,
        size_chart_image: (((x.metadata as Record<string, unknown> | null)?.["page"] as Record<string, unknown> | undefined)?.["sizeChartImage"] as string | undefined) ?? "",
        price: v.length ? Math.min(...v.map((y) => Number(y.price))) : 0,
        compare_at_price: v.find((y) => y.compare_at_price != null)?.compare_at_price ?? null,
      }));
      return { rows, sports: s.data ?? [] };
    },
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [fields, setFields] = useState<string[]>(["name", "price", "status"]);
  const [sel, setSel] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [edits, setEdits] = useState<Record<string, Record<string, unknown>>>({});
  const [saving, setSaving] = useState(false);

  const rows = data?.rows ?? [];
  const filtered = useMemo(() => rows.filter((r) => (r.name + String(r["slug"])).toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const chosen = FIELDS.filter((f) => fields.includes(f.key));
  const val = (r: Row, k: string) => (edits[r.id] && k in edits[r.id]! ? edits[r.id]![k] : r[k]);
  const setVal = (id: string, k: string, v: unknown) => setEdits((e) => ({ ...e, [id]: { ...e[id], [k]: v } }));
  const changed = Object.values(edits).reduce((a, e) => a + Object.keys(e).length, 0);

  function fillColumn(k: string, v: unknown) {
    setEdits((e) => { const n = { ...e }; for (const id of sel) n[id] = { ...n[id], [k]: v }; return n; });
  }

  async function save() {
    setSaving(true);
    try {
      for (const [id, e] of Object.entries(edits)) {
        const { price: price, compare_at_price: compare_at_price, size_chart_image: chart, ...prod } = e as { price?: unknown; compare_at_price?: unknown; size_chart_image?: unknown } & Record<string, unknown>;
        if (chart !== undefined) {
          const meta = { ...((rows.find((r) => r.id === id)?.["metadata"] as Record<string, unknown> | null) ?? {}) };
          meta["page"] = { ...((meta["page"] as Record<string, unknown> | undefined) ?? {}), sizeChartImage: String(chart ?? "") };
          prod["metadata"] = meta;
        }
        if (Object.keys(prod).length) {
          const { error } = await supabase.from("products").update(prod as never).eq("id", id);
          if (error) throw new Error(`${rows.find((r) => r.id === id)?.name}: ${error.message}`);
        }
        const vp: Record<string, unknown> = {};
        if (price !== undefined) vp["price"] = Number(price) || 0;
        if (compare_at_price !== undefined) vp["compare_at_price"] = compare_at_price === "" || compare_at_price == null ? null : Number(compare_at_price);
        if (Object.keys(vp).length) {
          const { error } = await supabase.from("product_variants").update(vp as never).eq("product_id", id);
          if (error) throw error;
        }
      }
      toast.success(`${Object.keys(edits).length} producten opgeslagen`);
      setEdits({}); qc.invalidateQueries(); refetch();
    } catch (e) { toast.error((e as Error).message); } finally { setSaving(false); }
  }

  function Cell({ r, f }: { r: Row; f: FieldDef }) {
    const v = val(r, f.key);
    const cls = `h-8 min-w-[140px] ${edits[r.id] && f.key in edits[r.id]! ? "border-primary bg-primary/5" : ""}`;
    const sel = "h-8 rounded-sm border border-input bg-background px-2 text-sm " + cls;
    switch (f.kind) {
      case "bool": return <input type="checkbox" checked={!!v} onChange={(e) => setVal(r.id, f.key, e.target.checked)} />;
      case "status": return <select className={sel} value={String(v)} onChange={(e) => setVal(r.id, f.key, e.target.value)}><option value="active">Actief</option><option value="draft">Concept</option><option value="unlisted">Verborgen</option><option value="archived">Gearchiveerd</option></select>;
      case "sport": return <select className={sel} value={String(v ?? "")} onChange={(e) => setVal(r.id, f.key, e.target.value || null)}><option value="">Geen</option>{data?.sports.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>;
      case "blank": return <select className={sel} value={String(v ?? "")} onChange={(e) => setVal(r.id, f.key, e.target.value || null)}><option value="">Geen</option>{BLANK_MODELS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>;
      case "tags": return <Input className={cls} defaultValue={((v as string[]) ?? []).join(", ")} onBlur={(e) => setVal(r.id, f.key, e.target.value.split(",").map((t) => t.trim()).filter(Boolean))} />;
      case "number": case "price": return <Input className={cls + " w-28 min-w-0"} type="number" step={f.kind === "price" ? "0.01" : "1"} defaultValue={v == null ? "" : String(v)} onBlur={(e) => setVal(r.id, f.key, e.target.value === "" ? (f.kind === "price" ? null : 0) : Number(e.target.value))} />;
      default: return <Input className={cls} defaultValue={String(v ?? "")} onBlur={(e) => setVal(r.id, f.key, f.key === "slug" ? e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") : e.target.value || (f.key === "name" ? r.name : null))} />;
    }
  }

  return (
    <AdminLayout title="Bulk aanpassen" actions={step === 2 ? <div className="flex gap-2"><Button variant="outline" onClick={() => setStep(1)}>← Selectie</Button><Button onClick={save} disabled={saving || !changed}>{saving ? "Opslaan…" : `Opslaan (${changed})`}</Button></div> : <Button disabled={!sel.length || !fields.length} onClick={() => setStep(2)}>Naar tabel ({sel.length})</Button>}>
      <Link to="/admin/products" className="mb-4 inline-block text-sm underline">← Alle producten</Link>
      {step === 1 ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <div className="space-y-2 rounded-sm bg-card p-5">
            <h2 className="font-semibold">1. Kies velden</h2>
            {FIELDS.map((f) => <label key={f.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={fields.includes(f.key)} onChange={(e) => setFields(e.target.checked ? [...fields, f.key] : fields.filter((x) => x !== f.key))} />{f.label}</label>)}
          </div>
          <div className="space-y-3 rounded-sm bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">2. Kies producten ({sel.length})</h2>
              <div className="flex gap-2"><Input placeholder="Zoeken…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-48" />
                <Button size="sm" variant="outline" onClick={() => setSel([...new Set([...sel, ...filtered.map((r) => r.id)])])}>Alles</Button>
                <Button size="sm" variant="outline" onClick={() => setSel([])}>Geen</Button></div></div>
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {filtered.map((r) => <label key={r.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sel.includes(r.id)} onChange={(e) => setSel(e.target.checked ? [...sel, r.id] : sel.filter((x) => x !== r.id))} />{r.name}<span className="text-xs text-muted-foreground">{String(r["status"])}</span></label>)}
            </div>
          </div>
        </div>
      ) : (
        <div className="overflow-auto rounded-sm bg-card">
          <p className="p-3 text-xs text-muted-foreground">Gewijzigde cellen worden groen omrand. Met "Hele kolom" vul je één waarde in voor alle producten. Prijzen gelden voor alle varianten van het product.</p>
          <table className="text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs text-muted-foreground">
              <tr><th className="p-2">Product</th>{chosen.map((f) => <th key={f.key} className="p-2">{f.label}</th>)}</tr>
              <tr className="border-b border-border"><th className="p-2 font-normal italic">Hele kolom</th>{chosen.map((f) => <th key={f.key} className="p-2 font-normal"><ColumnFill f={f} sports={data?.sports ?? []} onApply={(v) => fillColumn(f.key, v)} /></th>)}</tr>
            </thead>
            <tbody>
              {rows.filter((r) => sel.includes(r.id)).map((r) => (
                <tr key={r.id} className="border-b border-border">
                  <td className="whitespace-nowrap p-2 font-medium"><Link to="/admin/products/$id" params={{ id: r.id }}>{r.name}</Link></td>
                  {chosen.map((f) => <td key={f.key + JSON.stringify(edits[r.id]?.[f.key] ?? null)} className="p-2"><Cell r={r} f={f} /></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}

function ColumnFill({ f, sports, onApply }: { f: FieldDef; sports: { id: string; name: string }[]; onApply: (v: unknown) => void }) {
  const [v, setV] = useState<string>("");
  const s = "h-7 rounded-sm border border-input bg-background px-1 text-xs";
  let input;
  if (f.kind === "bool") input = <select className={s} value={v} onChange={(e) => setV(e.target.value)}><option value="">—</option><option value="1">Aan</option><option value="0">Uit</option></select>;
  else if (f.kind === "status") input = <select className={s} value={v} onChange={(e) => setV(e.target.value)}><option value="">—</option><option value="active">Actief</option><option value="draft">Concept</option><option value="unlisted">Verborgen</option><option value="archived">Gearchiveerd</option></select>;
  else if (f.kind === "sport") input = <select className={s} value={v} onChange={(e) => setV(e.target.value)}><option value="">—</option><option value="__none">Geen</option>{sports.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>;
  else if (f.kind === "blank") input = <select className={s} value={v} onChange={(e) => setV(e.target.value)}><option value="">—</option><option value="__none">Geen</option>{BLANK_MODELS.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}</select>;
  else input = <input className={s + " w-24"} type={f.kind === "price" || f.kind === "number" ? "number" : "text"} value={v} onChange={(e) => setV(e.target.value)} />;
  function apply() {
    if (v === "" && f.kind !== "text") return;
    let out: unknown = v;
    if (f.kind === "bool") out = v === "1";
    else if (f.kind === "price" || f.kind === "number") out = Number(v);
    else if (f.kind === "tags") out = v.split(",").map((t) => t.trim()).filter(Boolean);
    else if (v === "__none") out = null;
    onApply(out);
  }
  return <div className="flex gap-1">{input}<button type="button" className="rounded-sm border border-input px-2 text-xs" onClick={apply}>Toepassen</button></div>;
}
