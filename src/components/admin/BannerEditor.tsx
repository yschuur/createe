import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MediaField } from "@/components/admin/MediaLibrary";
import { bannersQuery, saveBanners, type Banner } from "@/lib/collection-banners";

export function BannerEditor({ slug, name }: { slug: string; name: string }) {
  const qc = useQueryClient();
  const { data } = useQuery(bannersQuery());
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Banner[]>([]);
  const count = (data?.[slug] ?? []).filter((b) => b.url).length;
  const start = () => { setList([...(data?.[slug] ?? [])]); setOpen(true); };
  const set = (i: number, p: Partial<Banner>) => setList(list.map((b, j) => (j === i ? { ...b, ...p } : b)));
  async function save() {
    const { error } = await saveBanners({ ...(data ?? {}), [slug]: list.filter((b) => b.url) });
    if (error) { toast.error(error.message); return; }
    toast.success("Afbeeldingen opgeslagen"); qc.invalidateQueries({ queryKey: ["site-settings", "collection_banners"] }); setOpen(false);
  }
  return <>
    <Button variant="outline" size="sm" onClick={start}>{name}: afbeeldingen ({count})</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Afbeeldingen onder producten: {name}</DialogTitle></DialogHeader>
        <p className="text-xs text-muted-foreground">De afbeeldingen vullen samen de hele breedte van de pagina.</p>
        {list.map((b, i) => (
          <div key={i} className="space-y-2 rounded-sm border border-border p-3">
            <MediaField value={b.url} onChange={(v) => set(i, { url: v })} />
            <Input value={b.link} placeholder="Link bij klikken, bijv. /products/fairway-to-heaven" onChange={(e) => set(i, { link: e.target.value })} />
            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setList(list.filter((_, j) => j !== i))}>Verwijderen</Button>
          </div>
        ))}
        <div className="flex justify-between"><Button variant="outline" onClick={() => setList([...list, { url: "", link: "" }])}>Afbeelding toevoegen</Button><Button onClick={save}>Opslaan</Button></div>
      </DialogContent>
    </Dialog>
  </>;
}
