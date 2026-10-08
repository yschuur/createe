import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, imgUrl } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/products/")({
  head: () => ({ meta: [{ title: "Producten | CREATEE beheer" }, { name: "description", content: "Producten | CREATEE beheer. Beheer de CREATEE webshop." }, { property: "og:title", content: "Producten | CREATEE beheer" }, { property: "og:description", content: "Producten | CREATEE beheer. Beheer de CREATEE webshop." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: ProductsAdmin,
});

const statusStyle: Record<string, string> = {
  active: "bg-primary text-primary-foreground", draft: "bg-muted text-muted-foreground",
  unlisted: "bg-accent text-accent-foreground", archived: "bg-foreground/10",
};

function ProductsAdmin() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const { data = [], isLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, product_variants(price, inventory_quantity, track_inventory), product_images(url, sort_order)").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  async function create() {
    const slug = `nieuw-product-${Date.now().toString(36)}`;
    const { data: p, error } = await supabase.from("products").insert({ slug, name: "Nieuw product", status: "draft" }).select("id").single();
    if (error || !p) return;
    await supabase.from("product_variants").insert({ product_id: p.id, price: 0 });
    nav({ to: "/admin/products/$id", params: { id: p.id } });
  }

  const rows = data.filter((p) => (status === "all" || p.status === status) && (p.name + p.slug).toLowerCase().includes(q.toLowerCase()));

  return (
    <AdminLayout title="Producten" actions={<div className="flex gap-2"><Link to="/admin/products/bulk"><Button variant="outline">Bulk aanpassen</Button></Link><Button onClick={create}>Product toevoegen</Button></div>}>
      <div className="mb-4 flex flex-wrap gap-3">
        <Input placeholder="Zoeken…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs bg-card" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-sm border border-input bg-card px-3 text-sm">
          <option value="all">Alle statussen</option><option value="active">Actief</option><option value="draft">Concept</option><option value="unlisted">Verborgen</option><option value="archived">Gearchiveerd</option>
        </select>
      </div>
      <div className="overflow-x-auto rounded-sm bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-muted-foreground"><tr><th className="p-3"></th><th className="p-3">Product</th><th className="p-3">Status</th><th className="p-3">Type</th><th className="p-3">Voorraad</th><th className="p-3">Prijs</th></tr></thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Laden…</td></tr>}
            {rows.map((p) => {
              const img = [...p.product_images].sort((a, b) => a.sort_order - b.sort_order)[0];
              const stock = p.product_variants.reduce((a, v) => a + (v.track_inventory ? v.inventory_quantity : 0), 0);
              const price = Math.min(...p.product_variants.map((v) => Number(v.price)));
              return (
                <tr key={p.id} className="cursor-pointer border-b border-border hover:bg-muted/50" onClick={() => nav({ to: "/admin/products/$id", params: { id: p.id } })}>
                  <td className="p-3">{img ? <img src={imgUrl(img.url, 100)} alt="" className="h-12 w-10 rounded-sm object-cover" /> : <div className="h-12 w-10 rounded-sm bg-muted" />}</td>
                  <td className="p-3"><Link to="/admin/products/$id" params={{ id: p.id }} className="font-medium">{p.name}</Link><p className="font-mono text-xs text-muted-foreground">{p.slug}</p></td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-xs ${statusStyle[p.status]}`}>{p.status}</span>{!p.published && <span className="ml-1 text-xs text-muted-foreground">niet gepubliceerd</span>}</td>
                  <td className="p-3 text-xs">{p.is_service ? "Dienst" : p.product_type}</td>
                  <td className="p-3">{p.is_service ? "-" : `${stock} in ${p.product_variants.length} var.`}</td>
                  <td className="p-3">{isFinite(price) ? formatPrice(price) : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
