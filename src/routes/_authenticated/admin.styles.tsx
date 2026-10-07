import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { COLORS, FONTS, PAGES, ROLES, sectionStylesQuery, type SectionStyles, type TextRole, type TextStyle } from "@/lib/section-styles";

export const Route = createFileRoute("/_authenticated/admin/styles")({
  head: () => ({ meta: [{ title: "Stijlen — CREATEE beheer" }, { name: "description", content: "Pas lettertypes en tekstgroottes per sectie aan." }, { property: "og:title", content: "Stijlen — CREATEE beheer" }, { property: "og:description", content: "Pas lettertypes en tekstgroottes per sectie aan." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: StylesAdmin,
});

const sel = "h-9 w-full rounded-sm border border-input bg-background px-2 text-sm";

function StylesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(sectionStylesQuery());
  const [s, setS] = useState<SectionStyles | null>(null);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && !s) setS(structuredClone(data)); }, [data, s]);
  if (!s) return <AdminLayout title="Stijlen"><p>Laden…</p></AdminLayout>;

  const set = (sid: string, role: TextRole, patch: Partial<TextStyle>) =>
    setS({ ...s, [sid]: { ...s[sid], [role]: { ...s[sid]?.[role], ...patch } } });
  const num = (v: string) => (v === "" ? undefined : Number(v));

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "section_styles", value: s, updated_at: new Date().toISOString() } as never);
    setBusy(false);
    if (error) { toast.error("Opslaan mislukt: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["site-settings", "section-styles"] });
    toast.success("Stijlen opgeslagen");
  }

  const current = PAGES[page]!;
  return <AdminLayout title="Stijlen" actions={<Button onClick={save} disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</Button>}>
    <p className="mb-4 text-sm text-muted-foreground">Kies een pagina en pas per sectie de koppen, tekst en knoppen aan. Lege velden gebruiken de standaardstijl.</p>
    <div className="mb-6 flex flex-wrap gap-2">
      {PAGES.map((p, i) => <Button key={p.label} size="sm" variant={i === page ? "default" : "outline"} onClick={() => setPage(i)}>{p.label}</Button>)}
    </div>
    <div className="space-y-6">
      {current.sections.map((sec) => <section key={sec.id} className="rounded-sm bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{sec.label}</h2>
          <Button variant="ghost" size="sm" onClick={() => { const n = { ...s }; delete n[sec.id]; setS(n); }}><RotateCcw /> Standaard</Button>
        </div>
        <div className="space-y-4">
          {ROLES.map((r) => { const v = s[sec.id]?.[r.id] ?? {}; return <div key={r.id} className="grid grid-cols-2 gap-3 border-t border-border pt-4 md:grid-cols-[120px_repeat(6,minmax(0,1fr))] md:items-end">
            <p className="col-span-2 font-medium md:col-span-1 md:pb-2">{r.label}</p>
            <div><Label className="text-xs">Lettertype</Label><select className={sel} value={v.font ?? ""} onChange={(e) => set(sec.id, r.id, { font: e.target.value || undefined })}><option value="">Standaard</option>{Object.keys(FONTS).map((f) => <option key={f}>{f}</option>)}</select></div>
            <div><Label className="text-xs">Grootte (px)</Label><Input type="number" min={8} max={120} value={v.size ?? ""} placeholder="—" onChange={(e) => set(sec.id, r.id, { size: num(e.target.value) })} /></div>
            <div><Label className="text-xs">Dikte</Label><select className={sel} value={v.weight ?? ""} onChange={(e) => set(sec.id, r.id, { weight: num(e.target.value) })}><option value="">Standaard</option>{[300, 400, 500, 600, 700, 800].map((w) => <option key={w} value={w}>{({300:"Licht",400:"Normaal",500:"Medium",600:"Halfvet",700:"Vet",800:"Extra vet"} as Record<number,string>)[w]}</option>)}</select></div>
            <div><Label className="text-xs">Regelhoogte</Label><Input type="number" step={0.1} min={0.8} max={3} value={v.lineHeight ?? ""} placeholder="—" onChange={(e) => set(sec.id, r.id, { lineHeight: num(e.target.value) })} /></div>
            <div><Label className="text-xs">Hoofdletters</Label><select className={sel} value={v.uppercase ?? ""} onChange={(e) => set(sec.id, r.id, { uppercase: e.target.value as TextStyle["uppercase"] })}><option value="">Standaard</option><option value="yes">Ja</option><option value="no">Nee</option></select></div>
            <div><Label className="text-xs">Kleur</Label><select className={sel} value={v.color ?? ""} onChange={(e) => set(sec.id, r.id, { color: e.target.value || undefined })}><option value="">Standaard</option>{Object.keys(COLORS).map((c) => <option key={c}>{c}</option>)}</select></div>
          </div>; })}
        </div>
      </section>)}
    </div>
  </AdminLayout>;
}
