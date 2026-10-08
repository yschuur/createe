import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/sports")({
  head: () => ({ meta: [{ title: "Sporten — CREATEE beheer" }, { name: "robots", content: "noindex" }] }),
  component: SportsAdmin,
});

const toSlug = (n: string) => n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function SportsAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin", "sports"], queryFn: async () => {
    const [s, p] = await Promise.all([supabase.from("sports").select("*").order("sort_order"), supabase.from("products").select("sport_id")]);
    return { sports: s.data ?? [], products: p.data ?? [] };
  } });
  const refresh = () => qc.invalidateQueries();
  async function create() {
    const name = prompt("Naam van de sport");
    if (!name?.trim()) return;
    const { error } = await supabase.from("sports").insert({ name: name.trim(), slug: toSlug(name), sort_order: data?.sports.length ?? 0 });
    if (error) toast.error(error.code === "23505" ? "Deze sport bestaat al." : "Toevoegen mislukt."); else refresh();
  }
  async function rename(id: string, name: string) {
    const { error } = await supabase.from("sports").update({ name }).eq("id", id);
    if (error) toast.error("Opslaan mislukt."); else refresh();
  }
  async function remove(id: string) {
    if (!confirm("Sport verwijderen? Producten van deze sport zijn daarna in geen enkele shop zichtbaar.")) return;
    await supabase.from("sports").delete().eq("id", id); refresh();
  }
  return <AdminLayout title="Sporten" actions={<Button onClick={create}>Sport toevoegen</Button>}>
    <p className="mb-4 text-sm text-muted-foreground">Elke sport heeft een eigen shop. Producten kies je per product een sport; collecties koppel je aan één of meer sporten.</p>
    <div className="space-y-3">{data?.sports.map((s) => <div key={s.id} className="flex flex-wrap items-center gap-4 rounded-sm bg-card p-4">
      <Input defaultValue={s.name} className="max-w-xs font-semibold" onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && rename(s.id, e.target.value.trim())} />
      <a href={`/collections/${s.slug}`} target="_blank" rel="noreferrer" className="font-mono text-xs underline">/collections/{s.slug}</a>
      <span className="text-sm">{data.products.filter((p) => p.sport_id === s.id).length} producten</span>
      <Button variant="ghost" size="sm" className="ml-auto text-destructive" onClick={() => remove(s.id)}>Verwijder</Button>
    </div>)}</div>
  </AdminLayout>;
}
