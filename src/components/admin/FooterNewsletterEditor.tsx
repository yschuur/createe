import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { discountProblem } from "@/lib/discounts";

export function FooterNewsletterEditor() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data = [], isLoading, error } = useQuery({
    queryKey: ["admin", "discounts"],
    queryFn: async () => {
      const result = await supabase.from("discounts").select("*").order("created_at", { ascending: false });
      if (result.error) throw result.error;
      return result.data ?? [];
    },
  });
  async function choose(id: string) {
    setBusy(true);
    const clear = await supabase.from("discounts").update({ newsletter: false }).eq("newsletter", true);
    if (clear.error) { setBusy(false); toast.error("Opslaan mislukt: " + clear.error.message); return; }
    const result = id ? await supabase.from("discounts").update({ newsletter: true }).eq("id", id) : { error: null };
    setBusy(false);
    await qc.invalidateQueries({ queryKey: ["admin", "discounts"] });
    if (result.error) toast.error("Opslaan mislukt: " + result.error.message);
    else toast.success("Nieuwsbriefcode opgeslagen");
  }
  const usable = data.filter((d) => !discountProblem({ ...d, min_order_amount: null }, 0));
  return <div className="space-y-2 border-t border-border pt-4">
    <Label htmlFor="footer-newsletter-code">Nieuwsbrief — actiecode na aanmelden</Label>
    <select id="footer-newsletter-code" disabled={busy || isLoading || !!error} value={data.find((d) => d.newsletter)?.id ?? ""} onChange={(e) => choose(e.target.value)} className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm">
      <option value="">Geen code tonen</option>
      {data.filter((d) => d.newsletter || usable.some((u) => u.id === d.id)).map((d) => <option key={d.id} value={d.id} disabled={!usable.some((u) => u.id === d.id)}>{d.code}{!usable.some((u) => u.id === d.id) ? " — niet beschikbaar" : ""}</option>)}
    </select>
    {error && <p className="text-sm text-destructive">Actiecodes konden niet worden geladen.</p>}
  </div>;
}