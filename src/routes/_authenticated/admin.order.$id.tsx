import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/shop";
import { STATUS_LABELS, STATUS_TONE } from "@/lib/order-status";
import { addOrderEvent, ORDER_STATUSES, resendOrderEmail, saveOrder, sendCustomOrderEmail, updateOrderStatus } from "@/lib/orders.functions";

export const Route = createFileRoute("/_authenticated/admin/order/$id")({
  head: () => ({ meta: [{ title: "Bestelling — Beheer" }] }),
  component: OrderDetail,
});

type Line = { id?: string; product_name: string; variant_label: string; unit_price: number; quantity: number };
type Addr = { line1: string; line2: string; postal_code: string; city: string; country: string };
type Ev = { at: string; text: string };

function OrderDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const key = ["admin-order", id];
  const { data, isLoading } = useQuery({
    queryKey: key,
    queryFn: async () => {
      const [o, i] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id).order("created_at"),
      ]);
      return { order: o.data, items: i.data ?? [] };
    },
  });
  const order = data?.order;
  const { data: history } = useQuery({
    queryKey: ["admin-order-history", order?.email],
    enabled: !!order?.email,
    queryFn: async () => (await supabase.from("orders").select("id, order_number, total, status, created_at").eq("email", order!.email!).neq("id", id).order("created_at", { ascending: false })).data ?? [],
  });

  const save = useServerFn(saveOrder);
  const setStatusFn = useServerFn(updateOrderStatus);
  const resend = useServerFn(resendOrderEmail);
  const custom = useServerFn(sendCustomOrderEmail);
  const note = useServerFn(addOrderEvent);

  const [form, setForm] = useState({ name: "", email: "", phone: "", shipping: 0, trackingUrl: "", note: "" });
  const [addr, setAddr] = useState<Addr>({ line1: "", line2: "", postal_code: "", city: "", country: "NL" });
  const [lines, setLines] = useState<Line[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("paid");
  const [mailOnStatus, setMailOnStatus] = useState(true);
  const [mail, setMail] = useState({ subject: "", message: "", includeItems: false });
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (!data?.order) return;
    const o = data.order; const a = (o.shipping_address ?? {}) as Partial<Addr>;
    setForm({ name: o.name ?? "", email: o.email ?? "", phone: o.phone ?? "", shipping: Number(o.shipping_total), trackingUrl: o.tracking_url ?? "", note: o.admin_note ?? "" });
    setAddr({ line1: a.line1 ?? "", line2: a.line2 ?? "", postal_code: a.postal_code ?? "", city: a.city ?? "", country: a.country ?? "NL" });
    setLines(data.items.map((i) => ({ id: i.id, product_name: i.product_name, variant_label: i.variant_label, unit_price: Number(i.unit_price), quantity: i.quantity })));
    setStatus(o.status);
    setMail((m) => m.subject ? m : { ...m, subject: `Over je bestelling ${o.order_number}` });
  }, [data]);

  const refresh = () => { qc.invalidateQueries({ queryKey: key }); qc.invalidateQueries({ queryKey: ["admin-orders"] }); };
  async function run(fn: () => Promise<any>, ok: string) {
    setBusy(true);
    try { const r = await fn(); if (r && r.ok === false) toast.error(r.error || "Niet gelukt"); else { toast.success(ok); refresh(); } }
    catch (e) { toast.error(e instanceof Error ? e.message : "Niet gelukt"); }
    finally { setBusy(false); }
  }

  if (isLoading) return <AdminLayout title="Bestelling"><p>Laden…</p></AdminLayout>;
  if (!order) return <AdminLayout title="Bestelling"><p>Bestelling niet gevonden.</p></AdminLayout>;

  const subtotal = lines.reduce((a, l) => a + l.unit_price * l.quantity, 0);
  const events = ((order.events as Ev[]) ?? []).slice().reverse();
  const validTrack = !form.trackingUrl || /^https?:\/\//.test(form.trackingUrl);

  return <AdminLayout title={`Bestelling ${order.order_number}`}>
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <Link to="/admin/orders" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:underline"><ArrowLeft className="h-4 w-4" />Alle bestellingen</Link>
      <span className={`rounded-sm px-2 py-1 text-xs ${STATUS_TONE[order.status] ?? "bg-muted"}`}>{STATUS_LABELS[order.status] ?? order.status}</span>
      {order.environment === "sandbox" && <span className="text-xs text-muted-foreground">Testbestelling</span>}
      <span className="text-sm text-muted-foreground">Geplaatst {new Date(order.created_at).toLocaleString("nl-NL")}</span>
      <Button className="ml-auto" disabled={busy || !validTrack} onClick={() => run(() => save({ data: { orderId: id, ...form, address: addr, items: lines } }), "Bestelling opgeslagen")}><Save className="mr-1 h-4 w-4" />Wijzigingen opslaan</Button>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-6">
        <Card title="Artikelen">
          <div className="space-y-2">
            <div className="hidden grid-cols-[1fr_1fr_100px_80px_90px_32px] gap-2 text-xs text-muted-foreground sm:grid"><span>Product</span><span>Variant</span><span>Prijs/stuk</span><span>Aantal</span><span className="text-right">Totaal</span><span /></div>
            {lines.map((l, n) => <div key={l.id ?? `new-${n}`} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_100px_80px_90px_32px] sm:items-center">
              <Input value={l.product_name} onChange={(e) => setLines(lines.map((x, i) => i === n ? { ...x, product_name: e.target.value } : x))} />
              <Input value={l.variant_label} placeholder="Kleur / maat" onChange={(e) => setLines(lines.map((x, i) => i === n ? { ...x, variant_label: e.target.value } : x))} />
              <Input type="number" step="0.01" min={0} value={l.unit_price} onChange={(e) => setLines(lines.map((x, i) => i === n ? { ...x, unit_price: Number(e.target.value) } : x))} />
              <Input type="number" min={1} value={l.quantity} onChange={(e) => setLines(lines.map((x, i) => i === n ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x))} />
              <span className="text-right font-medium">{formatPrice(l.unit_price * l.quantity)}</span>
              <Button variant="ghost" size="icon" aria-label="Regel verwijderen" onClick={() => setLines(lines.filter((_, i) => i !== n))}><Trash2 className="h-4 w-4" /></Button>
            </div>)}
            <Button variant="outline" size="sm" onClick={() => setLines([...lines, { product_name: "", variant_label: "", unit_price: 0, quantity: 1 }])}><Plus className="mr-1 h-4 w-4" />Regel toevoegen</Button>
          </div>
          <div className="mt-4 space-y-1 border-t pt-3 text-sm">
            <Row label="Subtotaal" value={formatPrice(subtotal)} />
            <div className="flex items-center justify-between"><span>Verzendkosten</span><Input className="w-28 text-right" type="number" step="0.01" min={0} value={form.shipping} onChange={(e) => setForm({ ...form, shipping: Number(e.target.value) })} /></div>
            <Row label="Totaal" value={formatPrice(subtotal + form.shipping)} bold />
            {Math.abs(subtotal + form.shipping - Number(order.total)) > 0.004 && <p className="text-xs text-muted-foreground">Opgeslagen totaal: {formatPrice(Number(order.total))} — wordt bijgewerkt bij opslaan. Let op: dit wijzigt geen betaling bij Stripe.</p>}
          </div>
        </Card>

        <Card title="Status & verzending">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><Label>Status</Label>
              <select className="mt-1 h-10 w-full rounded-md border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                {ORDER_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
            <div><Label>Trackinglink</Label><Input className="mt-1" placeholder="https://…" value={form.trackingUrl} onChange={(e) => setForm({ ...form, trackingUrl: e.target.value })} />{!validTrack && <p className="mt-1 text-xs text-destructive">Moet beginnen met https://</p>}</div>
          </div>
          {(status === "production" || status === "shipped") && <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={mailOnStatus} onChange={(e) => setMailOnStatus(e.target.checked)} />Klant mailen ({status === "shipped" ? "verzendmail met trackinglink" : "productiemail"})</label>}
          <Button className="mt-3" size="sm" disabled={busy || !validTrack || (status === "shipped" && mailOnStatus && !form.trackingUrl)}
            onClick={() => run(() => setStatusFn({ data: { orderId: id, status: status as any, trackingUrl: form.trackingUrl, sendEmail: mailOnStatus } }), "Status bijgewerkt")}>Status opslaan</Button>
          {status === "shipped" && mailOnStatus && !form.trackingUrl && <p className="mt-1 text-xs text-muted-foreground">Vul een trackinglink in om de verzendmail te sturen.</p>}
        </Card>

        <Card title="E-mail naar klant">
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="w-full text-sm text-muted-foreground">Statusmail opnieuw versturen:</span>
            {([["confirmation", "Orderbevestiging"], ["production", "In productie"], ["shipped", "Verzonden"]] as const).map(([k, l]) =>
              <Button key={k} variant="outline" size="sm" disabled={busy || !order.email || (k === "shipped" && !order.tracking_url)}
                onClick={() => confirm(`${l}-mail opnieuw sturen naar ${order.email}?`) && run(() => resend({ data: { orderId: id, kind: k } }), "Mail verstuurd")}><RefreshCw className="mr-1 h-3 w-3" />{l}</Button>)}
          </div>
          <div className="space-y-2 border-t pt-4">
            <Label>Eigen bericht aan {order.email ?? "klant"}</Label>
            <Input value={mail.subject} onChange={(e) => setMail({ ...mail, subject: e.target.value })} placeholder="Onderwerp" />
            <Textarea rows={6} value={mail.message} onChange={(e) => setMail({ ...mail, message: e.target.value })} placeholder="Schrijf je bericht…" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={mail.includeItems} onChange={(e) => setMail({ ...mail, includeItems: e.target.checked })} />Besteloverzicht meesturen</label>
            <Button size="sm" disabled={busy || !order.email || !mail.message.trim()} onClick={() => run(async () => { const r = await custom({ data: { orderId: id, ...mail } }); if (r.ok) setMail({ ...mail, message: "" }); return r; }, "E-mail verstuurd")}><Mail className="mr-1 h-4 w-4" />Versturen</Button>
          </div>
        </Card>

        <Card title="Tijdlijn">
          <div className="mb-3 flex gap-2"><Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Notitie toevoegen aan de tijdlijn" />
            <Button size="sm" variant="outline" disabled={busy || !newNote.trim()} onClick={() => run(async () => { const r = await note({ data: { orderId: id, text: newNote } }); setNewNote(""); return r; }, "Notitie toegevoegd")}>Toevoegen</Button></div>
          <ol className="space-y-2 text-sm">
            {events.map((e, n) => <li key={n} className="border-l-2 border-primary pl-3"><div className="text-xs text-muted-foreground">{new Date(e.at).toLocaleString("nl-NL")}</div>{e.text}</li>)}
            <li className="border-l-2 border-muted pl-3"><div className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleString("nl-NL")}</div>Bestelling geplaatst</li>
          </ol>
        </Card>
      </div>

      <div className="space-y-6">
        <Card title="Klant">
          <div className="space-y-2">
            <Field label="Naam" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
            <Field label="E-mail" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <Field label="Telefoon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            {order.email && <a className="text-sm underline" href={`mailto:${order.email}`}>Mailen vanuit je eigen mailprogramma</a>}
          </div>
        </Card>
        <Card title="Bezorgadres">
          <div className="space-y-2">
            <Field label="Straat + huisnummer" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} />
            <Field label="Toevoeging" value={addr.line2} onChange={(v) => setAddr({ ...addr, line2: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Postcode" value={addr.postal_code} onChange={(v) => setAddr({ ...addr, postal_code: v })} />
              <Field label="Plaats" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
            </div>
            <Field label="Land (NL/BE)" value={addr.country} onChange={(v) => setAddr({ ...addr, country: v.toUpperCase().slice(0, 2) })} />
          </div>
        </Card>
        <Card title="Interne notitie">
          <Textarea rows={4} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Alleen zichtbaar voor beheer" />
        </Card>
        <Card title="Betaling">
          <div className="space-y-1 text-sm">
            <Row label="Omgeving" value={order.environment === "sandbox" ? "Test" : "Live"} />
            <Row label="Valuta" value={order.currency.toUpperCase()} />
            {order.stripe_session_id && <p className="break-all text-xs text-muted-foreground">Stripe-sessie: {order.stripe_session_id}</p>}
          </div>
        </Card>
        {!!history?.length && <Card title={`Eerdere bestellingen (${history.length})`}>
          <ul className="space-y-1 text-sm">{history.map((h) => <li key={h.id} className="flex justify-between gap-2">
            <Link to="/admin/order/$id" params={{ id: h.id }} className="underline">{h.order_number}</Link>
            <span className="text-muted-foreground">{STATUS_LABELS[h.status] ?? h.status}</span>
            <span>{formatPrice(Number(h.total))}</span>
          </li>)}</ul>
        </Card>}
      </div>
    </div>
  </AdminLayout>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-sm border bg-card p-4"><h2 className="mb-3 font-semibold">{title}</h2>{children}</section>;
}
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className={`flex justify-between ${bold ? "text-base font-semibold" : ""}`}><span>{label}</span><span>{value}</span></div>;
}
function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <div><Label className="text-xs text-muted-foreground">{label}</Label><Input className="mt-1" value={value} onChange={(e) => onChange(e.target.value)} /></div>;
}
