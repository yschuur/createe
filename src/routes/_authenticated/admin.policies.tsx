import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POLICY_SLUGS, policiesQuery, policiesSchema, type Policies } from "@/lib/policies";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/policies")({
  head: () => ({ meta: [{ title: "Beleidspagina's | CREATEE beheer" }, { name: "description", content: "Beheer privacy, voorwaarden, retouren en verzendbeleid van CREATEE." }, { property: "og:title", content: "Beleidspagina's | CREATEE beheer" }, { property: "og:description", content: "Beheer privacy, voorwaarden, retouren en verzendbeleid van CREATEE." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: AdminPolicies,
});

function AdminPolicies() {
  const qc = useQueryClient();
  const { data } = useQuery(policiesQuery());
  const [draft, setDraft] = useState<Policies | null>(null);
  const cur = draft ?? data;
  if (!cur) return <AdminLayout title="Beleidspagina's"><p>Laden…</p></AdminLayout>;
  const set = (slug: (typeof POLICY_SLUGS)[number], k: "label" | "title" | "body", v: string) => setDraft({ ...cur, [slug]: { ...cur[slug], [k]: v } });
  async function save() {
    const r = policiesSchema.safeParse(cur);
    if (!r.success) { toast.error("Vul bij elke pagina een titel in."); return; }
    const { error } = await supabase.from("site_settings").upsert({ key: "policies", value: r.data }, { onConflict: "key" });
    if (error) { toast.error("Opslaan mislukt."); return; }
    qc.setQueryData(policiesQuery().queryKey, r.data); setDraft(null); toast.success("Beleidspagina's opgeslagen");
  }
  return <AdminLayout title="Beleidspagina's" actions={<Button onClick={save} disabled={!draft}><Save className="mr-2 size-4" />Opslaan</Button>}>
    <Tabs defaultValue={POLICY_SLUGS[0]}>
      <TabsList>{POLICY_SLUGS.map(s => <TabsTrigger key={s} value={s}>{cur[s].label}</TabsTrigger>)}</TabsList>
      {POLICY_SLUGS.map(s => <TabsContent key={s} value={s} className="space-y-4">
        <a href={`/policies/${s}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">Bekijk pagina<ExternalLink className="size-3" /></a>
        <label className="block text-sm">Titel<RichTextEditor minHeight={50} value={cur[s].title} onChange={v => set(s, "title", v)} /></label>
        <label className="block text-sm">Inhoud<RichTextEditor minHeight={400} value={cur[s].body} onChange={v => set(s, "body", v)} /></label>
      </TabsContent>)}
    </Tabs>
  </AdminLayout>;
}
