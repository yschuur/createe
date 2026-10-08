import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [{ title: "Klanten — CREATEE beheer" }, { name: "description", content: "Alle klanten, inzenders en nieuwsbriefleden van CREATEE." }, { property: "og:title", content: "Klanten — CREATEE beheer" }, { property: "og:description", content: "Alle klanten, inzenders en nieuwsbriefleden van CREATEE." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: Customers,
});

type Customer = {
  email: string; name: string; phone: string; last: string;
  orders: { id: string; number: string; total: number; status: string; date: string }[];
  contact: number; studio: number; newsletter: string | null; newsletterId: string | null;
};

function Customers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "orders" | "forms" | "newsletter">("all");
  const [open, setOpen] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: async () => {
      const [o, c, d, n] = await Promise.all([
        supabase.from("orders").select("id, order_number, email, name, phone, total, status, created_at, environment").neq("status", "pending"),
        supabase.from("contact_submissions").select("email, name, phone, created_at"),
        supabase.from("design_requests").select("email, name, phone, created_at"),
        supabase.from("newsletter_subscribers").select("id, email, created_at"),
      ]);
      return { orders: o.data ?? [], contact: c.data ?? [], studio: d.data ?? [], news: n.data ?? [] };
    },
  });

  const customers = useMemo(() => {
    const map = new Map<string, Customer>();
    const get = (email: string | null, name?: string | null, phone?: string | null, date?: string) => {
      const key = (email ?? "").trim().toLowerCase();
      if (!key) return null;
      let c = map.get(key);
      if (!c) { c = { email: key, name: "", phone: "", last: "", orders: [], contact: 0, studio: 0, newsletter: null, newsletterId: null }; map.set(key, c); }
      if (name && !c.name) c.name = name;
      if (phone && !c.phone) c.phone = phone;
      if (date && date > c.last) c.last = date;
      return c;
    };
    for (const o of data?.orders ?? []) get(o.email, o.name, o.phone, o.created_at)?.orders.push({ id: o.id, number: o.order_number, total: Number(o.total), status: o.status, date: o.created_at });
    for (const r of data?.contact ?? []) { const c = get(r.email, r.name, r.phone, r.created_at); if (c) c.contact++; }
    for (const r of data?.studio ?? []) { const c = get(r.email, r.name, r.phone, r.created_at); if (c) c.studio++; }
    for (const r of data?.news ?? []) { const c = get(r.email, null, null, r.created_at); if (c) { c.newsletter = r.created_at; c.newsletterId = r.id; } }
    return [...map.values()].sort((a, b) => b.last.localeCompare(a.last));
  }, [data]);

  const shown = customers.filter((c) =>
    (filter === "all" || (filter === "orders" && c.orders.length) || (filter === "forms" && c.contact + c.studio) || (filter === "newsletter" && c.newsletter)) &&
    (!q || `${c.email} ${c.name}`.toLowerCase().includes(q.toLowerCase())));

  async function unsubscribe(id: string) {
    if (!confirm("Uit de nieuwsbrieflijst halen?")) return;
    const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
    if (error) { toast.error("Verwijderen mislukt"); return; }
    qc.invalidateQueries({ queryKey: ["admin", "customers"] });
  }
  function exportCsv() {
    const rows = [["E-mail", "Naam", "Telefoon", "Bestellingen", "Besteed", "Contact", "Studio", "Nieuwsbrief"], ...shown.map((c) => [c.email, c.name, c.phone, String(c.orders.length), c.orders.reduce((s, o) => s + o.total, 0).toFixed(2), String(c.contact), String(c.studio), c.newsletter ? "ja" : "nee"])];
    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "klanten.csv"; a.click();
  }
  const fmt = (d: string) => new Date(d).toLocaleDateString("nl-NL");

  return (
    <AdminLayout title="Klanten" actions={<Button variant="outline" onClick={exportCsv}>Exporteren (CSV)</Button>}>
      <div className="mb-4 grid gap-3 md:grid-cols-4">
        {[["Totaal", customers.length], ["Met bestelling", customers.filter((c) => c.orders.length).length], ["Formulier ingevuld", customers.filter((c) => c.contact + c.studio).length], ["Nieuwsbrief", customers.filter((c) => c.newsletter).length]].map(([l, v]) => (
          <div key={l} className="rounded-sm bg-card p-4"><p className="text-xs text-muted-foreground">{l}</p><p className="text-2xl font-semibold">{v}</p></div>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek op naam of e-mail" className="max-w-xs" />
        {([["all", "Alle"], ["orders", "Bestellers"], ["forms", "Formulieren"], ["newsletter", "Nieuwsbrief"]] as const).map(([k, l]) => (
          <Button key={k} size="sm" variant={filter === k ? "default" : "outline"} onClick={() => setFilter(k)}>{l}</Button>
        ))}
      </div>
      <div className="space-y-2">
        {shown.map((c) => (
          <div key={c.email} className="rounded-sm bg-card text-sm">
            <button className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left" onClick={() => setOpen(open === c.email ? null : c.email)}>
              <div><p className="font-medium">{c.name || c.email}</p><p className="text-muted-foreground">{c.email}{c.phone ? ` · ${c.phone}` : ""}</p></div>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {c.orders.length > 0 && <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-primary">{c.orders.length} bestelling{c.orders.length > 1 ? "en" : ""} · {formatPrice(c.orders.reduce((s, o) => s + o.total, 0))}</span>}
                {c.contact > 0 && <span className="rounded-sm bg-muted px-2 py-0.5">Contact {c.contact}×</span>}
                {c.studio > 0 && <span className="rounded-sm bg-muted px-2 py-0.5">Studio {c.studio}×</span>}
                {c.newsletter && <span className="rounded-sm bg-muted px-2 py-0.5">Nieuwsbrief</span>}
              </div>
            </button>
            {open === c.email && (
              <div className="space-y-3 border-t border-border p-4">
                <p><a className="underline" href={`mailto:${c.email}`}>Mail sturen</a> · laatst actief {c.last ? fmt(c.last) : "–"}</p>
                {c.orders.length > 0 && <ul className="space-y-1">{c.orders.map((o) => (
                  <li key={o.id}><Link to="/admin/order/$id" params={{ id: o.id }} className="underline">{o.number}</Link> · {fmt(o.date)} · {formatPrice(o.total)} · {o.status}</li>
                ))}</ul>}
                {(c.contact + c.studio) > 0 && <p><Link to="/admin/submissions" className="underline">Bekijk inzendingen</Link></p>}
                {c.newsletterId && <p>Aangemeld voor de nieuwsbrief op {fmt(c.newsletter!)} · <button className="text-destructive underline" onClick={() => unsubscribe(c.newsletterId!)}>afmelden</button></p>}
              </div>
            )}
          </div>
        ))}
        {shown.length === 0 && <p className="text-muted-foreground">Geen klanten gevonden.</p>}
      </div>
    </AdminLayout>
  );
}
