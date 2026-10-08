import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { BLANK_MODELS, DEFAULT_SIZES, blankKey } from "@/lib/blank-stock";
import { prettyValue } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/stock")({
  head: () => ({ meta: [{ title: "Blanco voorraad | CREATEE beheer" }, { name: "description", content: "Beheer de gedeelde voorraad blanco kleding per model, kleur en maat." }, { property: "og:title", content: "Blanco voorraad | CREATEE beheer" }, { property: "og:description", content: "Beheer de gedeelde voorraad blanco kleding." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: StockAdmin,
});

type Row = { model: string; color: string; size: string; quantity: number };

function StockAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "blank-stock"],
    queryFn: async () => {
      const [s, p] = await Promise.all([
        supabase.from("blank_stock").select("model, color, size, quantity"),
        supabase.from("products").select("id, blank_model"),
      ]);
      if (s.error) throw s.error;
      return { stock: s.data as Row[], products: p.data ?? [] };
    },
  });
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [newColor, setNewColor] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const k = (r: { model: string; color: string; size: string }) => `${r.model}|${r.color}|${r.size}`;

  async function save() {
    const rows = Object.entries(edits).map(([key, quantity]) => { const [model, color, size] = key.split("|") as [string, string, string]; return { model, color, size, quantity }; });
    if (!rows.length) return;
    setSaving(true);
    const { error } = await supabase.from("blank_stock").upsert(rows);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setEdits({}); toast.success("Voorraad opgeslagen - alle gekoppelde producten zijn bijgewerkt");
    qc.invalidateQueries();
  }

  async function addColor(model: string) {
    const color = blankKey(newColor[model] ?? "");
    if (!color) return;
    const { error } = await supabase.from("blank_stock").upsert(DEFAULT_SIZES.map((size) => ({ model, color, size, quantity: 0 })), { ignoreDuplicates: true });
    if (error) { toast.error(error.message); return; }
    setNewColor({ ...newColor, [model]: "" });
    qc.invalidateQueries({ queryKey: ["admin", "blank-stock"] });
  }

  async function removeColor(model: string, color: string) {
    if (!confirm(`Kleur ${prettyValue(color)} verwijderen uit de blanco voorraad? Gekoppelde varianten houden hun laatste aantal.`)) return;
    await supabase.from("blank_stock").delete().eq("model", model).eq("color", color);
    qc.invalidateQueries({ queryKey: ["admin", "blank-stock"] });
  }

  return (
    <AdminLayout title="Blanco voorraad" actions={<Button onClick={save} disabled={saving || !Object.keys(edits).length}>{saving ? "Opslaan…" : "Opslaan"}</Button>}>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">Je voorraad bestaat uit blanco kleding. Een aantal hier geldt voor álle ontwerpen van dat model in die kleur en maat. Na een verkoop gaat het automatisch van deze voorraad af. Koppel een product aan een model via Producten → Blanco model.</p>
      <div className="space-y-6">
        {BLANK_MODELS.map((m) => {
          const rows = (data?.stock ?? []).filter((r) => r.model === m.key);
          const colors = [...new Set(rows.map((r) => r.color))].sort();
          const sizes = [...new Set([...DEFAULT_SIZES, ...rows.map((r) => r.size)])].filter((s) => rows.some((r) => r.size === s) || !rows.length);
          const linked = data?.products.filter((p) => p.blank_model === m.key).length ?? 0;
          return (
            <section key={m.key} className="rounded-sm bg-card p-5">
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-semibold">{m.label}</h2>
                <span className="text-sm text-muted-foreground">{linked} product{linked === 1 ? "" : "en"} gekoppeld</span>
              </div>
              {colors.length ? (
                <div className="overflow-x-auto">
                  <table className="text-sm">
                    <thead className="text-left text-muted-foreground"><tr><th className="p-2">Kleur</th>{sizes.map((s) => <th key={s} className="p-2">{prettyValue(s)}</th>)}<th className="p-2">Totaal</th><th /></tr></thead>
                    <tbody>
                      {colors.map((c) => {
                        let total = 0;
                        return (
                          <tr key={c} className="border-t border-border">
                            <td className="p-2 font-medium">{prettyValue(c)}</td>
                            {sizes.map((s) => {
                              const r = rows.find((x) => x.color === c && x.size === s);
                              const key = k({ model: m.key, color: c, size: s });
                              const val = edits[key] ?? r?.quantity ?? 0;
                              total += val;
                              return <td key={s} className="p-1"><Input type="number" min={0} className={`h-8 w-20 ${val <= 1 ? "border-destructive" : ""}`} value={val} onChange={(e) => setEdits({ ...edits, [key]: Math.max(0, Math.trunc(Number(e.target.value))) })} /></td>;
                            })}
                            <td className="p-2">{total}</td>
                            <td className="p-2"><button className="text-xs text-muted-foreground underline" onClick={() => removeColor(m.key, c)}>verwijderen</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : <p className="text-sm text-muted-foreground">Nog geen kleuren.</p>}
              <div className="mt-3 flex gap-2">
                <Input placeholder="Nieuwe kleur, bijv. beige" className="max-w-xs" value={newColor[m.key] ?? ""} onChange={(e) => setNewColor({ ...newColor, [m.key]: e.target.value })} />
                <Button variant="outline" onClick={() => addColor(m.key)}>Kleur toevoegen</Button>
              </div>
            </section>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Kleurnamen moeten gelijk zijn aan de kleur bij de productvarianten (bijv. "beige", "luxe-white").</p>
    </AdminLayout>
  );
}
