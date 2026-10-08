import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import type { ProductPageContent } from "@/lib/product-page";

export function ProductPageEditor({ value, onChange }: { value: ProductPageContent; onChange: (v: ProductPageContent) => void }) {
  const set = <K extends keyof ProductPageContent>(k: K, v: ProductPageContent[K]) => onChange({ ...value, [k]: v });
  const acc = value.accordions;
  const setAcc = (i: number, patch: Partial<ProductPageContent["accordions"][number]>) => set("accordions", acc.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  const moveAcc = (i: number, d: number) => { const a = [...acc]; const j = i + d; const first = a[i], second = a[j]; if (!first || !second) return; a[i] = second; a[j] = first; set("accordions", a); };
  const F = (label: string, k: keyof ProductPageContent) => (
    <div><Label>{label}</Label><Input value={value[k] as string} onChange={(e) => set(k, e.target.value as never)} /></div>
  );
  return (
    <div className="space-y-4">
      <div><Label>Introtekst</Label><RichTextEditor value={value.intro} onChange={(v) => set("intro", v)} /></div>
      {F("Knoptekst winkelwagen", "addToCartLabel")}
      <div className="grid grid-cols-2 gap-3">
        {F("Label 1", "fitLabel")}{F("Waarde 1", "fitValue")}
        {F("Label 2", "modelLabel")}{F("Waarde 2", "modelValue")}
        {F("Maattabel-knop", "sizeChartLabel")}{F("Maattabel-afbeelding (URL, opent als pop-up)", "sizeChartImage")}
      </div>
      {value.sizeChartImage && <img src={value.sizeChartImage} alt="Maattabel" className="max-h-40 rounded-sm border border-border" />}
      <div className="space-y-3 rounded-sm border border-border p-3">
        <label className="flex items-center justify-between text-sm font-medium">Groen kenmerkenblok tonen<Switch checked={value.featureShow} onCheckedChange={(c) => set("featureShow", c)} /></label>
        {value.featureShow && (<>
          {F("Titel", "featureTitle")}
          <div className="grid grid-cols-2 gap-3">{F("Knoptekst", "featureLinkLabel")}{F("Knoplink", "featureLinkUrl")}</div>
          <div><Label>Kenmerken (één per regel)</Label><Textarea rows={4} value={value.featureBadges.join("\n")} onChange={(e) => set("featureBadges", e.target.value.split("\n"))} /></div>
        </>)}
      </div>
      <div className="space-y-3">
        <Label>Uitklapblokken</Label>
        {acc.map((a, i) => (
          <div key={i} className="space-y-2 rounded-sm border border-border p-3">
            <div className="flex gap-2">
              <Input value={a.title} placeholder="Titel" onChange={(e) => setAcc(i, { title: e.target.value })} />
              <button onClick={() => moveAcc(i, -1)} aria-label="Omhoog"><ArrowUp className="h-4 w-4" /></button>
              <button onClick={() => moveAcc(i, 1)} aria-label="Omlaag"><ArrowDown className="h-4 w-4" /></button>
              <button onClick={() => set("accordions", acc.filter((_, j) => j !== i))} aria-label="Verwijder"><Trash2 className="h-4 w-4 text-destructive" /></button>
            </div>
            <RichTextEditor value={a.html} placeholder="Inhoud" onChange={(v) => setAcc(i, { html: v })} />
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => set("accordions", [...acc, { title: "Nieuw blok", html: "", open: false }])}><Plus className="mr-1 h-4 w-4" /> Blok</Button>
      </div>
    </div>
  );
}
