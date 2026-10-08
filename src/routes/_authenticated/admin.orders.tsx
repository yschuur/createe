import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { updateOrderStatus } from "@/lib/orders.functions";
import { formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Bestellingen — Beheer" }] }),
  component: AdminOrders,
});

const STATUS: Record<string, string> = { pending: "Wacht op betaling", paid: "Betaald", production: "In productie", shipped: "Verzonden", failed: "Mislukt", cancelled: "Geannuleerd" };

type Order = { id: string; order_number: string; status: string; name: string | null; email: string | null; total: number; created_at: string; tracking_url: string | null; environment: string };

function AdminOrders() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, order_number, status, name, email, total, created_at, tracking_url, environment").in("status", ["paid", "production", "shipped"]).order("created_at", { ascending: false }).limit(200);
      return (data ?? []) as Order[];
    },
  });
  return <AdminLayout title="Bestellingen">
    {isLoading ? <p>Laden…</p> : !data?.length ? <p className="text-muted-foreground">Nog geen betaalde bestellingen.</p> :
      <div className="space-y-3">{data.map(o => <OrderRow key={o.id} order={o} />)}</div>}
  </AdminLayout>;
}

function OrderRow({ order }: { order: Order }) {
  const qc = useQueryClient();
  const [tracking, setTracking] = useState(order.tracking_url ?? "");
  const [busy, setBusy] = useState(false);
  async function go(status: "production" | "shipped") {
    if (status === "shipped" && !/^https?:\/\//.test(tracking.trim())) { toast.error("Vul eerst een geldige trackinglink in (begint met https://)."); return; }
    setBusy(true);
    try {
      await updateOrderStatus({ data: { orderId: order.id, status, trackingUrl: tracking.trim(), sendEmail: true } });
      toast.success(status === "shipped" ? "Gemarkeerd als verzonden, mail verstuurd" : "In productie gezet, mail verstuurd");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch { toast.error("Bijwerken mislukt."); } finally { setBusy(false); }
  }
  return <div className="flex flex-wrap items-center gap-3 rounded-sm bg-card p-4">
    <div className="min-w-48 flex-1">
      <p className="font-semibold">{order.order_number} {order.environment === "sandbox" && <span className="ml-1 text-xs text-muted-foreground">(test)</span>}</p>
      <p className="text-sm text-muted-foreground">{order.name ?? "—"} · {order.email ?? "—"} · {new Date(order.created_at).toLocaleDateString("nl-NL")}</p>
    </div>
    <span className="text-sm font-medium">{formatPrice(Number(order.total))}</span>
    <span className="rounded-sm bg-muted px-2 py-1 text-xs">{STATUS[order.status] ?? order.status}</span>
    <Input className="w-64" placeholder="Trackinglink" value={tracking} onChange={e => setTracking(e.target.value)} />
    <Button variant="outline" size="sm" disabled={busy} onClick={() => go("production")}>In productie + mail</Button>
    <Button size="sm" disabled={busy} onClick={() => go("shipped")}>Verzonden + mail</Button>
  </div>;
}
