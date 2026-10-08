import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUp, ArrowDown, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { TypographyEditor } from "@/components/admin/PageEditor";
import { pageSettingsQuery, parsePageConfig, type PageConfig, type RoleId } from "@/lib/page-settings";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { contactFaqQuery, faqSchema, type FaqConfig } from "@/lib/contact";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/contact")({
  head: () => ({ meta: [{ title: "Contact & FAQ — CREATEE beheer" }, { name: "description", content: "Beheer veelgestelde vragen en lees ontvangen contactberichten." }, { property: "og:title", content: "Contact & FAQ — CREATEE beheer" }, { property: "og:description", content: "Categorieën, vragen, antwoorden en contactberichten beheren." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: ContactAdmin,
});

function ContactAdmin() {
  const qc = useQueryClient();
  const query = useQuery(contactFaqQuery());
  const pageQuery = useQuery(pageSettingsQuery("contact"));
  const [pageDraft, setPageDraft] = useState<PageConfig | null>(null);
  const pageConfig = pageDraft ?? pageQuery.data ?? { sections: {} };
  const [draft, setDraft] = useState<FaqConfig | null>(null);
  const [busy, setBusy] = useState(false);
  const config = draft ?? query.data;
  function change(fn: (value: FaqConfig) => void) {
    if (!config) return;
    const next = structuredClone(config); fn(next); setDraft(next);
  }
  function move<T>(list: T[], index: number, offset: number) {
    const item = list[index];
    if (item === undefined || index + offset < 0 || index + offset >= list.length) return;
    list.splice(index, 1); list.splice(index + offset, 0, item);
  }
  async function save() {
    const result = faqSchema.safeParse(config);
    if (!result.success) { toast.error("Vul alle categorieën, vragen en antwoorden in."); return; }
    setBusy(true);
    const savedPage = parsePageConfig(pageConfig);
    const { error } = await supabase.from("site_settings").upsert([
      { key: "contact_faq", value: result.data, updated_at: new Date().toISOString() },
      { key: "page_contact", value: savedPage as never, updated_at: new Date().toISOString() },
    ]);
    setBusy(false);
    if (error) { toast.error("Opslaan mislukt."); return; }
    qc.setQueryData(contactFaqQuery().queryKey, result.data); setDraft(null); toast.success("FAQ opgeslagen");
    qc.setQueryData(pageSettingsQuery("contact").queryKey, savedPage); setPageDraft(null);
  }
  return <AdminLayout title="Contact & FAQ" actions={<Button onClick={save} disabled={busy || !config}><Save />{busy ? "Opslaan…" : "FAQ opslaan"}</Button>}>
    <Tabs defaultValue="faq"><TabsList><TabsTrigger value="faq">Veelgestelde vragen</TabsTrigger><TabsTrigger value="typography">FAQ-opmaak</TabsTrigger><TabsTrigger value="messages">Berichten</TabsTrigger></TabsList>
      <TabsContent value="typography" className="space-y-4">
        <p className="text-sm text-muted-foreground">Elke instelling geldt voor alle categorieën, alle vragen of alle antwoorden. De teksten zelf blijven afzonderlijk bewerkbaar.</p>
        {(["faq-category", "faq-question", "faq-answer"] as RoleId[]).map(role => <div key={role} data-faq-editor={role}><TypographyEditor role={role} value={pageConfig.sections["contact-faq"]?.typography?.[role]} onChange={style => {
          const section = pageConfig.sections["contact-faq"] ?? {};
          const typography = { ...section.typography };
          if (style) typography[role] = style; else delete typography[role];
          setPageDraft({ ...pageConfig, sections: { ...pageConfig.sections, "contact-faq": { ...section, typography } } });
        }} /></div>)}
      </TabsContent>
      <TabsContent value="faq" className="space-y-6">
        <p className="text-sm text-muted-foreground">Categorieën en vragen verschijnen in deze volgorde. Alle antwoorden starten gesloten. <Link className="underline" to="/admin/pages/$page" params={{ page: "contact" }}>Formulierteksten en knopopmaak aanpassen</Link></p>
        {query.isError && <p role="alert">De FAQ kon niet worden geladen. Probeer het opnieuw.</p>}
        {config?.categories.map((category, i) => <section key={category.id} className="space-y-4 border-t border-border pt-6">
          <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><h2 className="min-w-0 text-lg font-semibold">Categorie {i + 1}</h2><div className="flex shrink-0 gap-1">
            <Button variant="ghost" size="icon" title="Categorie omhoog" aria-label="Categorie omhoog" disabled={!i} onClick={() => change(d => move(d.categories, i, -1))}><ArrowUp /></Button>
            <Button variant="ghost" size="icon" title="Categorie omlaag" aria-label="Categorie omlaag" disabled={i === config.categories.length - 1} onClick={() => change(d => move(d.categories, i, 1))}><ArrowDown /></Button>
            <Button variant="ghost" size="icon" title="Categorie verwijderen" aria-label="Categorie verwijderen" onClick={() => { if (confirm("Deze categorie met alle vragen verwijderen?")) change(d => d.categories.splice(i, 1)); }}><Trash2 /></Button>
          </div></header>
          <label className="block text-sm">Categorietitel<RichTextEditor minHeight={50} value={category.title} onChange={v => change(d => { const c = d.categories[i]; if (c) c.title = v; })} /></label>
          <label className="block text-sm">Icoon<select className="ml-3 rounded-sm border border-input bg-background p-2" value={category.icon} onChange={e => change(d => { const c = d.categories[i]; if (c) c.icon = e.target.value as typeof c.icon; })}>{[["general", "Algemeen"], ["orders", "Bestellingen"], ["shipping", "Verzending"], ["returns", "Retouren"], ["studio", "Design Studio"]].map(([v, label]) => <option key={v} value={v}>{label}</option>)}</select></label>
          {category.items.map((item, j) => <div key={item.id} className="grid gap-3 border-l-2 border-border pl-4">
            <div className="flex items-center justify-between"><h3 className="text-sm font-medium">Vraag {j + 1}</h3><div className="flex gap-1">
              <Button variant="ghost" size="icon" title="Vraag omhoog" aria-label="Vraag omhoog" disabled={!j} onClick={() => change(d => { const c = d.categories[i]; if (c) move(c.items, j, -1); })}><ArrowUp /></Button>
              <Button variant="ghost" size="icon" title="Vraag omlaag" aria-label="Vraag omlaag" disabled={j === category.items.length - 1} onClick={() => change(d => { const c = d.categories[i]; if (c) move(c.items, j, 1); })}><ArrowDown /></Button>
              <Button variant="ghost" size="icon" title="Vraag verwijderen" aria-label="Vraag verwijderen" onClick={() => { if (confirm("Deze vraag verwijderen?")) change(d => d.categories[i]?.items.splice(j, 1)); }}><Trash2 /></Button>
            </div></div>
            <RichTextEditor minHeight={50} value={item.question} onChange={v => change(d => { const q = d.categories[i]?.items[j]; if (q) q.question = v; })} />
            <label className="text-sm">Antwoord<RichTextEditor value={item.answer} onChange={v => change(d => { const q = d.categories[i]?.items[j]; if (q) q.answer = v; })} /></label>
          </div>)}
          <Button variant="outline" onClick={() => change(d => d.categories[i]?.items.push({ id: crypto.randomUUID(), question: "Nieuwe vraag", answer: "Antwoord" }))}><Plus />Vraag toevoegen</Button>
        </section>)}
        <Button variant="outline" onClick={() => change(d => d.categories.push({ id: crypto.randomUUID(), title: "Nieuwe categorie", icon: "general", items: [] }))}><Plus />Categorie toevoegen</Button>
      </TabsContent>
      <TabsContent value="messages"><ContactMessages /></TabsContent>
    </Tabs>
  </AdminLayout>;
}

function ContactMessages() {
  const { data, isPending, isError, refetch } = useQuery({ queryKey: ["admin-contact-messages"], queryFn: async () => {
    const { data, error } = await supabase.from("contact_submissions").select("*").order("created_at", { ascending: false });
    if (error) throw error; return data;
  } });
  return <div className="space-y-4"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Ontvangen berichten</h2><Button variant="outline" onClick={() => refetch()}>Vernieuwen</Button></div>
    {isPending ? <p>Laden…</p> : isError ? <p role="alert">Berichten konden niet worden geladen.</p> : !data?.length ? <p className="text-muted-foreground">Nog geen berichten ontvangen.</p> : data.map(m => <article key={m.id} className="border-t border-border py-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3"><h3 className="min-w-0 break-words font-semibold">{m.name}</h3><time className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("nl-NL")}</time></div>
      <a className="break-all text-sm text-primary underline" href={`mailto:${encodeURIComponent(m.email)}`}>{m.email}</a>
      {m.phone && <p className="text-sm">Telefoon: {m.phone}</p>}{m.order_number && <p className="text-sm">Ordernummer: {m.order_number}</p>}
      <p className="mt-3 whitespace-pre-wrap break-words text-sm">{m.message}</p>
    </article>)}
  </div>;
}