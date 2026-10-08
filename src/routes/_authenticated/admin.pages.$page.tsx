import { createFileRoute, Link, useBlocker } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ResetLink, SectionEditor, ViewPageLink } from "@/components/admin/PageEditor";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { isPlainObject, pageDefBySlug, pageSettingsQuery, parsePageConfig, type PageConfig, type SectionConfig } from "@/lib/page-settings";

export const Route = createFileRoute("/_authenticated/admin/pages/$page")({
  head: () => ({ meta: [{ title: "Pagina bewerken — CREATEE beheer" }, { name: "description", content: "Pas de onderdelen van een CREATEE-pagina aan." }, { property: "og:title", content: "Pagina bewerken — CREATEE beheer" }, { property: "og:description", content: "Pas de onderdelen van een CREATEE-pagina aan." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: PageEditorRoute,
});

/** Removes empty values so only real overrides are stored. */
function prune(v: unknown): unknown {
  if (Array.isArray(v)) return v;
  if (!isPlainObject(v)) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    const p = prune(x);
    if (p === undefined || (isPlainObject(p) && Object.keys(p).length === 0)) continue;
    out[k] = p;
  }
  return out;
}

function PageEditorRoute() {
  const { page } = Route.useParams();
  const def = pageDefBySlug(page);
  if (!def) return <AdminLayout title="Pagina niet gevonden"><Link to="/admin/pages" className="underline">Terug naar pagina's</Link></AdminLayout>;
  return <Editor key={def.key} slug={page} />;
}

function Editor({ slug }: { slug: string }) {
  const def = pageDefBySlug(slug)!;
  const qc = useQueryClient();
  const { data, isLoading } = useQuery(pageSettingsQuery(def.key));
  const [draft, setDraft] = useState<PageConfig | null>(null);
  const [active, setActive] = useState(def.sections[0]!.id);
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);
  useEffect(() => { if (data && !draft) setDraft(structuredClone(data)); }, [data, draft]);

  const savedJson = useMemo(() => JSON.stringify(prune(data ?? { sections: {} })), [data]);
  const dirty = !!draft && JSON.stringify(prune(draft)) !== savedJson;
  useBlocker({ shouldBlockFn: () => dirty && !window.confirm("Je hebt niet-opgeslagen wijzigingen. Toch weggaan?"), enableBeforeUnload: () => dirty });

  if (isLoading || !draft) return <AdminLayout title={def.label}><p>Laden…</p></AdminLayout>;
  const section = def.sections.find((s) => s.id === active)!;
  const setSection = (id: string, v: SectionConfig | undefined) => {
    const sections = { ...draft.sections };
    if (v) sections[id] = v; else delete sections[id];
    setDraft({ sections });
  };

  async function save() {
    const clean = (prune(draft) ?? { sections: {} }) as PageConfig;
    const parsed = parsePageConfig(clean);
    if (JSON.stringify(prune(parsed)) !== JSON.stringify(clean)) { toast.error("Een van de waarden is ongeldig (bijvoorbeeld een kleur of getal). Controleer de rode velden."); return; }
    setBusy(true);
    const { error } = await supabase.from("site_settings").upsert({ key: def.storageKey, value: { sections: clean.sections ?? {} }, updated_at: new Date().toISOString() } as never);
    setBusy(false);
    if (error) { toast.error("Opslaan mislukt: " + error.message); return; }
    await qc.invalidateQueries({ queryKey: ["site-settings", "page", def.key] });
    toast.success("Wijzigingen opgeslagen");
  }
  async function resetPage() {
    if (!window.confirm(`Weet je zeker dat je alle aanpassingen op "${def.label}" wilt terugzetten naar de standaard?`)) return;
    setBusy(true);
    const { error } = await supabase.from("site_settings").delete().eq("key", def.storageKey);
    setBusy(false);
    if (error) { toast.error("Terugzetten mislukt: " + error.message); return; }
    setDraft({ sections: {} }); setVersion((v) => v + 1);
    await qc.invalidateQueries({ queryKey: ["site-settings", "page", def.key] });
    toast.success("Pagina teruggezet naar standaard");
  }

  return <AdminLayout title={def.label} actions={<div className="flex flex-wrap items-center gap-2">
    {dirty && <span className="rounded-sm bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">Niet-opgeslagen wijzigingen</span>}
    <ViewPageLink to={def.viewUrl} />
    <Button onClick={save} disabled={busy || !dirty}>{busy ? "Opslaan…" : "Wijzigingen opslaan"}</Button>
  </div>}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <Link to="/admin/pages" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Alle pagina's</Link>
      <ResetLink onClick={resetPage} label="Hele pagina terugzetten naar standaard" />
    </div>
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <nav className="flex gap-2 overflow-x-auto lg:flex-col" aria-label="Onderdelen">
        {def.sections.map((s, i) => { const c = draft.sections[s.id]; const changed = !!c && Object.keys(prune(c) as object).length > 0; return <button key={s.id} type="button" onClick={() => setActive(s.id)}
          className={`flex shrink-0 items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm ${active === s.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
          <span>{i + 1}. {s.label}</span>
          <span className="flex items-center gap-1">{c?.visible === false && <EyeOff className="size-3.5" aria-label="Verborgen" />}{changed && <span className="size-2 rounded-full bg-current opacity-70" aria-label="Aangepast" />}</span>
        </button>; })}
      </nav>
      <section className="min-w-0 rounded-sm bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{section.label}</h2>
          {draft.sections[section.id] && <ResetLink onClick={() => { setSection(section.id, undefined); setVersion((v) => v + 1); }} label="Onderdeel terugzetten naar standaard" />}
        </div>
        <SectionEditor key={`${section.id}-${version}`} version={version} def={section} value={draft.sections[section.id] ?? {}} onChange={(v) => setSection(section.id, v)} />
      </section>
    </div>
  </AdminLayout>;
}
