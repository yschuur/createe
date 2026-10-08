import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaField } from "@/components/admin/MediaLibrary";
import { ImageFocusEditor } from "@/components/admin/ImageFocusEditor";
import { bannerHeightsQuery, bannersQuery, saveBannerHeights, saveBanners, type Banner } from "@/lib/collection-banners";

export function BannerEditor({ slug, name }: { slug: string; name: string }) {
  const qc = useQueryClient();
  const { data } = useQuery(bannersQuery());
  const [open, setOpen] = useState(false);
  const { data: heights } = useQuery(bannerHeightsQuery());
  const [list, setList] = useState<Banner[]>([]);
  const [height, setHeight] = useState(0);
  const count = (data?.[slug] ?? []).filter((b) => b.url).length;
  const start = () => { setList([...(data?.[slug] ?? [])]); setHeight(heights?.[slug] ?? 0); setOpen(true); };
  const set = (i: number, p: Partial<Banner>) => setList(list.map((b, j) => (j === i ? { ...b, ...p } : b)));
  async function save() {
    const { error } = await saveBanners({ ...(data ?? {}), [slug]: list.filter((b) => b.url) });
    if (error) { toast.error(error.message); return; }
    const h = await saveBannerHeights({ ...(heights ?? {}), [slug]: height });
    if (h.error) { toast.error(h.error.message); return; }
    toast.success("Afbeeldingen opgeslagen"); qc.invalidateQueries({ queryKey: ["site-settings", "collection_banners"] }); qc.invalidateQueries({ queryKey: ["site-settings", "collection_banner_heights"] }); setOpen(false);
  }
  return <>
    <Button variant="outline" size="sm" onClick={start}>{name}: afbeeldingen ({count})</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Afbeeldingen onder producten: {name}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">De afbeeldingen vullen samen de hele breedte van de pagina.</p>
        <label className="block space-y-1 text-sm"><span className="font-medium">Hoogte van de sectie (px, desktop)</span>
          <Input type="number" min={0} max={1200} step={10} value={height || ""} placeholder="Automatisch (staande foto's)" onChange={(e) => setHeight(Math.max(0, Math.min(1200, Number(e.target.value) || 0)))} />
          <span className="text-xs text-muted-foreground">Leeg = automatisch. Op mobiel wordt de hoogte naar verhouding kleiner.</span></label>
        {list.map((b, i) => (
          <div key={i} className="space-y-2 rounded-sm border border-border p-3">
            <MediaField value={b.url} onChange={(v) => set(i, { url: v })} />
            {b.url && <><p className="text-xs text-muted-foreground">Sleep de foto om te kiezen welk deel in het kader valt.</p>
              <ImageFocusEditor url={b.url} value={b.focus ?? { x: 50, y: 50 }} onChange={(f) => set(i, { focus: f })}
                aspectRatio={height ? Math.max(0.3, Math.min(4, (1440 / Math.max(1, list.filter((x) => x.url).length)) / height)) : 3 / 4} /></>}
            <Input value={b.link} placeholder="Link bij klikken, bijv. /products/fairway-to-heaven" onChange={(e) => set(i, { link: e.target.value })} />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setList(list.filter((_, j) => j !== i))}>Verwijderen</Button>
          </div>
        ))}
        <div className="flex justify-between"><Button variant="outline" onClick={() => setList([...list, { url: "", link: "" }])}>Afbeelding toevoegen</Button><Button onClick={save}>Opslaan</Button></div>
      </DialogContent>
    </Dialog>
  </>;
}
