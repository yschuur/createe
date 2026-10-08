import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EMAIL_KEYS, EMAIL_LABELS, orderEmailsQuery, orderEmailsSchema, type EmailKey, type OrderEmails, type OrderEmailEntry } from "@/lib/order-emails";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/emails")({
  head: () => ({ meta: [{ title: "E-mails - Beheer" }] }),
  component: AdminEmails,
});

function AdminEmails() {
  const qc = useQueryClient();
  const { data } = useQuery(orderEmailsQuery());
  const [draft, setDraft] = useState<OrderEmails | null>(null);
  const cur = draft ?? data;
  if (!cur) return <AdminLayout title="E-mails"><p>Laden…</p></AdminLayout>;
  const set = (k: EmailKey, f: keyof OrderEmailEntry, v: string) => setDraft({ ...cur, [k]: { ...cur[k], [f]: v } });
  async function save() {
    const r = orderEmailsSchema.safeParse(cur);
    if (!r.success) { toast.error("Vul een geldig e-mailadres, onderwerp en kop in."); return; }
    const { error } = await supabase.from("site_settings").upsert({ key: "order_emails", value: r.data }, { onConflict: "key" });
    if (error) { toast.error("Opslaan mislukt."); return; }
    qc.setQueryData(orderEmailsQuery().queryKey, r.data); setDraft(null); toast.success("E-mails opgeslagen");
  }
  return <AdminLayout title="E-mails" actions={<Button onClick={save} disabled={!draft}><Save className="mr-2 size-4" />Opslaan</Button>}>
    <div className="space-y-6">
      <label className="block max-w-md text-sm">Meldingen van nieuwe bestellingen naar<Input value={cur.owner_email} onChange={e => setDraft({ ...cur, owner_email: e.target.value })} /></label>
      <p className="text-sm text-muted-foreground">Gebruik {"{order}"} voor het bestelnummer en {"{name}"} voor de naam van de klant. Laat een witregel tussen alinea's.</p>
      <Tabs defaultValue="confirmation">
        <TabsList>{EMAIL_KEYS.map(k => <TabsTrigger key={k} value={k}>{EMAIL_LABELS[k]}</TabsTrigger>)}</TabsList>
        {EMAIL_KEYS.map(k => <TabsContent key={k} value={k} className="max-w-2xl space-y-4 rounded-sm bg-card p-6">
          <label className="block text-sm">Onderwerp<Input value={cur[k].subject} onChange={e => set(k, "subject", e.target.value)} /></label>
          <label className="block text-sm">Kop<Input value={cur[k].heading} onChange={e => set(k, "heading", e.target.value)} /></label>
          <label className="block text-sm">Tekst<Textarea rows={8} value={cur[k].body} onChange={e => set(k, "body", e.target.value)} /></label>
          {k === "shipped" && <label className="block text-sm">Knoptekst voor trackinglink<Input value={cur[k].button} onChange={e => set(k, "button", e.target.value)} /></label>}
        </TabsContent>)}
      </Tabs>
    </div>
  </AdminLayout>;
}
