import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { STATIC_PAGES, saveSeo, seoQuery, type SeoMap } from "@/lib/seo";
import { POLICY_SLUGS, defaultPolicies } from "@/lib/policies";

export const Route = createFileRoute("/_authenticated/admin/seo")({
  head: () => ({ meta: [{ title: "SEO | CREATEE beheer" }, { name: "description", content: "Alle SEO-titels en omschrijvingen op één plek." }, { property: "og:title", content: "SEO | CREATEE beheer" }, { property: "og:description", content: "Alle SEO-titels en omschrijvingen op één plek." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: SeoAdmin,
});

type Kind = "Pagina" | "Sport" | "Collectie" | "Product";
type Row = { id: string; kind: Kind; label: string; path: string; title: string; description: string; defTitle: string; defDesc: string; productId?: string };

function SeoAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-seo"],
    queryFn: async () => {
      const [seo, sports, cols, prods] = await Promise.all([
        qc.fetchQuery({ ...seoQuery(), staleTime: 0 }),
        supabase.from("sports").select("name, slug").order("sort_order"),
        supabase.from("collections").select("name, slug").order("sort_order"),
        supabase.from("products").select("id, name, handle, seo_title, seo_description").order("name"),
      ]);
      const rows: Row[] = [];
      const fromMap = (id: string) => ({ title: seo[id]?.title ?? "", description: seo[id]?.description ?? "" });
      for (const p of STATIC_PAGES) rows.push({ id: `page:${p.key}`, kind: "Pagina", label: p.label, path: p.path, defTitle: p.title, defDesc: p.description, ...fromMap(`page:${p.key}`) });
      for (const s of POLICY_SLUGS) { const p = defaultPolicies[s]; rows.push({ id: `policy:${s}`, kind: "Pagina", label: p.title, path: `/policies/${s}`, defTitle: `${p.title} | CREATEE`, defDesc: `${p.title} van CREATEE: alles wat je moet weten over ${p.label.toLowerCase()}.`, ...fromMap(`policy:${s}`) }); }
      for (const s of sports.data ?? []) rows.push({ id: `sport:${s.slug}`, kind: "Sport", label: s.name, path: `/collections/${s.slug}`, defTitle: `${s.name} | CREATEE`, defDesc: `Shop de CREATEE ${s.name} collectie: unieke designs, technische stoffen.`, ...fromMap(`sport:${s.slug}`) });
      for (const c of cols.data ?? []) rows.push({ id: `collection:${c.slug}`, kind: "Collectie", label: c.name, path: `?collection=${c.slug}`, defTitle: `${c.name} | CREATEE`, defDesc: `Shop de CREATEE ${c.name} collectie: unieke designs, technische stoffen.`, ...fromMap(`collection:${c.slug}`) });
      for (const p of prods.data ?? []) rows.push({ id: `product:${p.id}`, productId: p.id, kind: "Product", label: p.name, path: `/products/${p.handle}`, defTitle: `${p.name} | CREATEE`, defDesc: `${p.name} van CREATEE.`, title: p.seo_title ?? "", description: p.seo_description ?? "" });
      return { rows, seo };
    },
  });
  const [edits, setEdits] = useState<Record<string, { title: string; description: string }>>({});
  const [kind, setKind] = useState<Kind | "Alles">("Alles");
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => (data?.rows ?? []).filter((r) => (kind === "Alles" || r.kind === kind) && r.label.toLowerCase().includes(q.toLowerCase())), [data, kind, q]);
  const dirty = Object.keys(edits).length;
  const val = (r: Row) => edits[r.id] ?? { title: r.title, description: r.description };
  const set = (r: Row, patch: Partial<{ title: string; description: string }>) => setEdits((e) => ({ ...e, [r.id]: { ...val(r), ...patch } }));

  async function save() {
    if (!data) return;
    setSaving(true);
    const map: SeoMap = { ...data.seo };
    const errors: string[] = [];
    for (const [id, v] of Object.entries(edits)) {
      const row = data.rows.find((r) => r.id === id)!;
      if (row.productId) {
        const { error } = await supabase.from("products").update({ seo_title: v.title.trim() || null, seo_description: v.description.trim() || null }).eq("id", row.productId);
        if (error) errors.push(row.label);
      } else map[id] = { title: v.title.trim(), description: v.description.trim() };
    }
    const { error } = await saveSeo(map);
    if (error) errors.push("pagina's/collecties");
    setSaving(false);
    if (errors.length) { toast.error(`Opslaan mislukt voor: ${errors.join(", ")}`); return; }
    setEdits({});
    await Promise.all([qc.invalidateQueries({ queryKey: ["admin-seo"] }), qc.invalidateQueries({ queryKey: ["site-settings", "seo"] })]);
    toast.success("SEO-teksten opgeslagen");
  }

  return <AdminLayout title="SEO" actions={<Button onClick={save} disabled={!dirty || saving}>{saving ? "Opslaan..." : `Opslaan${dirty ? ` (${dirty})` : ""}`}</Button>}>
    <p className="mb-4 text-sm text-muted-foreground">Laat een veld leeg om de standaardtekst (grijs) te gebruiken. Nieuwe pagina's, sporten, collecties en producten verschijnen hier vanzelf. Advies: titel tot 60 tekens, omschrijving tot 160.</p>
    <div className="mb-4 flex flex-wrap gap-2">
      {(["Alles", "Pagina", "Sport", "Collectie", "Product"] as const).map((k) => <Button key={k} size="sm" variant={kind === k ? "default" : "outline"} onClick={() => setKind(k)}>{k === "Alles" ? "Alles" : k === "Pagina" ? "Pagina's" : k === "Sport" ? "Sporten" : k === "Collectie" ? "Collecties" : "Producten"}</Button>)}
      <Input className="ml-auto max-w-xs" placeholder="Zoeken..." value={q} onChange={(e) => setQ(e.target.value)} />
    </div>
    {isLoading ? <p>Laden...</p> : <div className="overflow-x-auto rounded-sm bg-card">
      <table className="w-full text-sm">
        <thead><tr className="border-b text-left"><th className="p-3 w-56">Onderdeel</th><th className="p-3">SEO-titel</th><th className="p-3">SEO-omschrijving</th></tr></thead>
        <tbody>{rows.map((r) => { const v = val(r); const changed = !!edits[r.id]; return <tr key={r.id} className="border-b align-top">
          <td className="p-3"><div className="font-medium">{r.label}</div><div className="text-xs text-muted-foreground">{r.kind} · {r.path}</div></td>
          <td className="p-3"><Input className={changed ? "ring-1 ring-primary" : ""} value={v.title} placeholder={r.defTitle} onChange={(e) => set(r, { title: e.target.value })} /><div className={`mt-1 text-xs ${(v.title || r.defTitle).length > 60 ? "text-destructive" : "text-muted-foreground"}`}>{(v.title || r.defTitle).length} tekens</div></td>
          <td className="p-3"><Textarea rows={2} className={changed ? "ring-1 ring-primary" : ""} value={v.description} placeholder={r.defDesc} onChange={(e) => set(r, { description: e.target.value })} /><div className={`mt-1 text-xs ${(v.description || r.defDesc).length > 160 ? "text-destructive" : "text-muted-foreground"}`}>{(v.description || r.defDesc).length} tekens</div></td>
        </tr>; })}</tbody>
      </table>
    </div>}
  </AdminLayout>;
}
