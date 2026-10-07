import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({ meta: [{ title: "Overzicht — CREATEE beheer" }, { name: "description", content: "Overzicht — CREATEE beheer. Beheer de CREATEE webshop." }, { property: "og:title", content: "Overzicht — CREATEE beheer" }, { property: "og:description", content: "Overzicht — CREATEE beheer. Beheer de CREATEE webshop." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const [p, v, r] = await Promise.all([
        supabase.from("products").select("id, status, is_service"),
        supabase.from("product_variants").select("id, inventory_quantity, track_inventory, product_id"),
        supabase.from("design_requests").select("*").order("created_at", { ascending: false }).limit(20),
      ]);
      return { products: p.data ?? [], variants: v.data ?? [], requests: r.data ?? [] };
    },
  });
  const active = data?.products.filter((p) => p.status === "active").length ?? 0;
  const low = data?.variants.filter((v) => v.track_inventory && v.inventory_quantity <= 1).length ?? 0;
  const stock = data?.variants.reduce((a, v) => a + (v.track_inventory ? v.inventory_quantity : 0), 0) ?? 0;

  async function setStatus(id: string, status: string) {
    await supabase.from("design_requests").update({ status }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
  }

  return (
    <AdminLayout title="Overzicht">
      <div className="grid gap-4 md:grid-cols-4">
        <Card label="Producten" value={data?.products.length ?? "–"} />
        <Card label="Actief in shop" value={active} />
        <Card label="Stuks op voorraad" value={stock} />
        <Card label="Varianten bijna op (≤1)" value={low} />
      </div>
      <div className="mt-8 rounded-sm bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Design Studio aanvragen</h2>
          <Link to="/admin/products" className="text-sm underline">Naar producten</Link>
        </div>
        {data?.requests.length ? (
          <ul className="divide-y divide-border">
            {data.requests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">{r.name} · <a href={`mailto:${r.email}`} className="underline">{r.email}</a>{r.phone ? ` · ${r.phone}` : ""}</p>
                  <p className="text-muted-foreground">{r.occasion}{r.quantity ? ` · ${r.quantity} stuks` : ""} · {new Date(r.created_at).toLocaleDateString("nl-NL")}</p>
                  <p className="mt-1 whitespace-pre-wrap">{r.message}</p>
                </div>
                <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded-sm border border-input bg-background px-2 py-1">
                  {["nieuw", "in behandeling", "afgerond"].map((s) => <option key={s}>{s}</option>)}
                </select>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted-foreground">Nog geen aanvragen.</p>}
      </div>
    </AdminLayout>
  );
}

function Card({ label, value }: { label: string; value: number | string }) {
  return <div className="rounded-sm bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-semibold">{value}</p></div>;
}
