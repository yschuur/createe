import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { menuQuery, type MenuItem } from "@/lib/menu";

export const Route = createFileRoute("/_authenticated/admin/menu")({
  head: () => ({ meta: [{ title: "Menu — CREATEE beheer" }, { name: "description", content: "Beheer het websitemenu van CREATEE." }, { property: "og:title", content: "Menu — CREATEE beheer" }, { property: "og:description", content: "Beheer het websitemenu van CREATEE." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: MenuAdmin,
});

type Path = number[];
const clone = (x: MenuItem[]): MenuItem[] => JSON.parse(JSON.stringify(x));
function listAt(items: MenuItem[], path: Path): MenuItem[] { let l = items; for (const i of path) l = l[i]!.children; return l; }
function swap(l: MenuItem[], a: number, b: number) { const t = l[a]!; l[a] = l[b]!; l[b] = t; }

function MenuAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery(menuQuery());
  const [items, setItems] = useState<MenuItem[] | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data && !items) setItems(clone(data)); }, [data, items]);
  if (!items) return <AdminLayout title="Menu"><p>Laden…</p></AdminLayout>;

  const mutate = (fn: (draft: MenuItem[]) => void) => { const d = clone(items); fn(d); setItems(d); };
  const parentList = (d: MenuItem[], path: Path) => listAt(d, path.slice(0, -1));
  const idx = (path: Path) => path[path.length - 1] ?? 0;

  async function save() {
    setBusy(true);
    const { error } = await supabase.from("site_settings").upsert({ key: "menu", value: { items }, updated_at: new Date().toISOString() } as never);
    setBusy(false);
    if (error) { toast.error("Opslaan mislukt: " + error.message); return; }
    qc.invalidateQueries({ queryKey: ["site-settings", "menu"] });
    toast.success("Menu opgeslagen");
  }

  function Row({ item, path }: { item: MenuItem; path: Path }) {
    const i = idx(path);
    const siblings = listAt(items!, path.slice(0, -1)).length;
    return <li key={path.join("-")} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 rounded-sm border border-border bg-background p-2">
        <Input aria-label="Naam" className="min-w-36 flex-1" value={item.label} onChange={e => mutate(d => { parentList(d, path)[i]!.label = e.target.value; })} />
        <Input aria-label="Link" className="min-w-44 flex-1" placeholder="/collections/golf" value={item.link} onChange={e => mutate(d => { parentList(d, path)[i]!.link = e.target.value; })} />
        <Button variant="ghost" size="icon" aria-label="Omhoog" disabled={i === 0} onClick={() => mutate(d => { swap(parentList(d, path), i, i - 1); })}><ArrowUp /></Button>
        <Button variant="ghost" size="icon" aria-label="Omlaag" disabled={i === siblings - 1} onClick={() => mutate(d => { swap(parentList(d, path), i, i + 1); })}><ArrowDown /></Button>
        <Button variant="ghost" size="icon" aria-label="Verwijderen" onClick={() => { if (item.children.length && !confirm("Dit item en alle submenu's verwijderen?")) return; mutate(d => { parentList(d, path).splice(i, 1); }); }}><Trash2 /></Button>
      </div>
      <ul className="ml-6 space-y-2 border-l border-border pl-4">
        {item.children.map((c, j) => Row({ item: c, path: [...path, j] }))}
        <li><Button variant="ghost" size="sm" onClick={() => mutate(d => { listAt(d, path).push({ label: "Nieuw item", link: "", children: [] }); })}><Plus /> Submenu toevoegen aan {item.label || "item"}</Button></li>
      </ul>
    </li>;
  }

  return <AdminLayout title="Menu" actions={<Button onClick={save} disabled={busy}>{busy ? "Opslaan…" : "Opslaan"}</Button>}>
    <section className="rounded-sm bg-card p-6">
      <p className="mb-4 text-sm text-muted-foreground">Elk item heeft een naam en een link (bijv. /collections/golf, /design-studio of een volledige webadres). Submenu's kun je onbeperkt nesten. Laat de link leeg voor een item zonder pagina.</p>
      <ul className="space-y-3">
        {items.map((it, i) => Row({ item: it, path: [i] }))}
        <li><Button variant="outline" onClick={() => mutate(d => { d.push({ label: "Nieuw item", link: "", children: [] }); })}><Plus /> Menu-item toevoegen</Button></li>
      </ul>
    </section>
  </AdminLayout>;
}
