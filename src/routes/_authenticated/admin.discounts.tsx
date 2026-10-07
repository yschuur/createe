import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/discounts")({
  head: () => ({ meta: [{ title: "Acties — CREATEE beheer" }, { name: "robots", content: "noindex" }] }),
  component: DiscountsAdmin,
});

function DiscountsAdmin() {
  const qc = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["admin", "discounts"],
    queryFn: async () => (await supabase.from("discounts").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const code = String(fd.get("code")).trim().toUpperCase();
    const value = Number(fd.get("value"));
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return toast.error("Code: 3–30 letters/cijfers");
    if (!(value > 0)) return toast.error("Waarde moet groter dan 0 zijn");
    const { error } = await supabase.from("discounts").insert({
      code, value, type: String(fd.get("type")), description: String(fd.get("description") || "") || null,
      min_order_amount: fd.get("min") ? Number(fd.get("min")) : null,
      starts_at: fd.get("starts") ? new Date(String(fd.get("starts"))).toISOString() : null,
      ends_at: fd.get("ends") ? new Date(String(fd.get("ends"))).toISOString() : null,
      usage_limit: fd.get("limit") ? Number(fd.get("limit")) : null,
    });
    if (error) { toast.error(error.message.includes("duplicate") ? "Deze code bestaat al" : error.message); return; }
    e.currentTarget.reset();
    qc.invalidateQueries({ queryKey: ["admin", "discounts"] });
  }
  async function toggle(id: string, active: boolean) { await supabase.from("discounts").update({ active }).eq("id", id); qc.invalidateQueries({ queryKey: ["admin", "discounts"] }); }
  async function remove(id: string) { if (!confirm("Actie verwijderen?")) return; await supabase.from("discounts").delete().eq("id", id); qc.invalidateQueries({ queryKey: ["admin", "discounts"] }); }

  return (
    <AdminLayout title="Acties & kortingscodes">
      <form onSubmit={create} className="mb-6 grid gap-3 rounded-sm bg-card p-5 md:grid-cols-4">
        <div><Label>Code</Label><Input name="code" placeholder="ZOMER20" required /></div>
        <div><Label>Soort</Label><select name="type" className="h-9 w-full rounded-sm border border-input bg-background px-2 text-sm"><option value="percentage">Percentage</option><option value="fixed">Vast bedrag (€)</option></select></div>
        <div><Label>Waarde</Label><Input name="value" type="number" step="0.01" required /></div>
        <div><Label>Min. bestelbedrag</Label><Input name="min" type="number" step="0.01" /></div>
        <div><Label>Start</Label><Input name="starts" type="date" /></div>
        <div><Label>Einde</Label><Input name="ends" type="date" /></div>
        <div><Label>Max. gebruik</Label><Input name="limit" type="number" /></div>
        <div><Label>Omschrijving</Label><Input name="description" /></div>
        <Button className="md:col-span-4">Actie aanmaken</Button>
      </form>
      <div className="space-y-2">
        {data.map((d) => (
          <div key={d.id} className="flex flex-wrap items-center justify-between gap-3 rounded-sm bg-card p-4 text-sm">
            <div>
              <p className="font-mono text-base font-semibold">{d.code}</p>
              <p className="text-muted-foreground">
                {d.type === "percentage" ? `${d.value}% korting` : `${formatPrice(d.value)} korting`}
                {d.min_order_amount ? ` · vanaf ${formatPrice(d.min_order_amount)}` : ""}
                {d.ends_at ? ` · t/m ${new Date(d.ends_at).toLocaleDateString("nl-NL")}` : ""}
                {` · ${d.times_used}${d.usage_limit ? `/${d.usage_limit}` : ""} gebruikt`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={d.active} onCheckedChange={(v) => toggle(d.id, v)} />
              <Button variant="ghost" size="sm" className="text-destructive" onClick={() => remove(d.id)}>Verwijder</Button>
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-sm text-muted-foreground">Nog geen acties.</p>}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Kortingscodes worden toegepast zodra online afrekenen is gekoppeld.</p>
    </AdminLayout>
  );
}
