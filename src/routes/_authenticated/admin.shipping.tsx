import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shippingQuery, shippingSchema, type ShippingSettings } from "@/lib/shipping";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/shipping")({
  head: () => ({ meta: [{ title: "Verzending - Beheer" }] }),
  component: AdminShipping,
});

function AdminShipping() {
  const qc = useQueryClient();
  const { data } = useQuery(shippingQuery());
  const [draft, setDraft] = useState<ShippingSettings | null>(null);
  const cur = draft ?? data;
  if (!cur) return <AdminLayout title="Verzending"><p>Laden…</p></AdminLayout>;
  async function save() {
    const r = shippingSchema.safeParse(cur);
    if (!r.success) { toast.error("Controleer de bedragen."); return; }
    const { error } = await supabase.from("site_settings").upsert({ key: "shipping", value: r.data }, { onConflict: "key" });
    if (error) { toast.error("Opslaan mislukt."); return; }
    qc.setQueryData(shippingQuery().queryKey, r.data); setDraft(null); toast.success("Verzending opgeslagen");
  }
  const num = (k: "rate" | "free_threshold", v: string) => setDraft({ ...cur, [k]: Number(v.replace(",", ".")) || 0 });
  return <AdminLayout title="Verzending" actions={<Button onClick={save} disabled={!draft}><Save className="mr-2 size-4" />Opslaan</Button>}>
    <div className="max-w-md space-y-4 rounded-sm bg-card p-6">
      <label className="block text-sm">Verzendkosten (€)<Input type="number" step="0.01" min="0" value={cur.rate} onChange={e => num("rate", e.target.value)} /></label>
      <label className="block text-sm">Gratis verzending vanaf (€)<Input type="number" step="0.01" min="0" value={cur.free_threshold} onChange={e => num("free_threshold", e.target.value)} /></label>
      <label className="block text-sm">Naam op afrekenpagina<Input value={cur.label} onChange={e => setDraft({ ...cur, label: e.target.value })} /></label>
      <p className="text-xs text-muted-foreground">Geldt voor Nederland en België.</p>
    </div>
  </AdminLayout>;
}
