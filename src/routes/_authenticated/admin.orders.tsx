import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shop";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/order-status";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  head: () => ({ meta: [{ title: "Bestellingen - Beheer" }] }),
  component: AdminOrders,
});

type Order = { id: string; order_number: string; status: string; name: string | null; email: string | null; total: number; created_at: string; environment: string };

const FILTERS = [["open", "Te verwerken"], ["paid", "Betaald"], ["production", "In productie"], ["shipped", "Verzonden"], ["all", "Alle"], ["pending", "Onbetaald"]] as const;

function AdminOrders() {
  const [filter, setFilter] = useState<string>("open");
  const [q, setQ] = useState("");
  const [showTest, setShowTest] = useState(true);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id, order_number, status, name, email, total, created_at, environment").order("created_at", { ascending: false }).limit(1000);
      return (data ?? []) as Order[];
    },
  });
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of data ?? []) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [data]);
  const list = (data ?? []).filter((o) => {
    if (!showTest && o.environment === "sandbox") return false;
    if (filter === "open" && !["paid", "production"].includes(o.status)) return false;
    if (!["open", "all"].includes(filter) && o.status !== filter) return false;
    const s = q.trim().toLowerCase();
    return !s || [o.order_number, o.name, o.email].some((v) => v?.toLowerCase().includes(s));
  });
  const revenue = (data ?? []).filter((o) => ["paid", "production", "shipped", "delivered"].includes(o.status) && o.environment !== "sandbox").reduce((a, o) => a + Number(o.total), 0);

  return <AdminLayout title="Bestellingen">
    <div className="mb-6 grid gap-3 sm:grid-cols-4">
      <Stat label="Te verwerken" value={(counts["paid"] ?? 0) + (counts["production"] ?? 0)} />
      <Stat label="Nieuw (betaald)" value={counts["paid"] ?? 0} />
      <Stat label="Verzonden" value={counts["shipped"] ?? 0} />
      <Stat label="Omzet (live)" value={formatPrice(revenue)} />
    </div>
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {FILTERS.map(([k, l]) => <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>)}
      <div className="relative ml-auto w-full sm:w-72">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" placeholder="Zoek op nummer, naam of e-mail" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showTest} onChange={(e) => setShowTest(e.target.checked)} />Testbestellingen tonen</label>
    </div>
    {isLoading ? <p>Laden…</p> : !list.length ? <p className="text-muted-foreground">Geen bestellingen gevonden.</p> :
      <div className="overflow-x-auto rounded-sm border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-muted-foreground"><tr>
            <th className="p-3">Bestelling</th><th className="p-3">Datum</th><th className="p-3">Klant</th><th className="p-3">Status</th><th className="p-3 text-right">Totaal</th>
          </tr></thead>
          <tbody>{list.map((o) => <tr key={o.id} className="border-b last:border-0 hover:bg-muted/50">
            <td className="p-3 font-semibold"><Link to="/admin/order/$id" params={{ id: o.id }} className="underline-offset-2 hover:underline">{o.order_number}</Link>{o.environment === "sandbox" && <span className="ml-1 text-xs font-normal text-muted-foreground">(test)</span>}</td>
            <td className="p-3">{new Date(o.created_at).toLocaleString("nl-NL", { dateStyle: "short", timeStyle: "short" })}</td>
            <td className="p-3"><div>{o.name ?? "-"}</div><div className="text-xs text-muted-foreground">{o.email}</div></td>
            <td className="p-3"><span className={`rounded-sm px-2 py-1 text-xs ${STATUS_TONE[o.status] ?? "bg-muted"}`}>{STATUS_LABELS[o.status] ?? o.status}</span></td>
            <td className="p-3 text-right font-medium">{formatPrice(Number(o.total))}</td>
          </tr>)}</tbody>
        </table>
      </div>}
  </AdminLayout>;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-sm border bg-card p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-semibold">{value}</div></div>;
}
