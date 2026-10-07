import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { galleryImages, variantColor, type ProductGallery } from "@/lib/product-gallery";
import { imgUrl, prettyValue, type ProductImage, type Variant } from "@/lib/shop";

export function ProductGalleryEditor({ images, variants, value, onChange }: {
  images: ProductImage[]; variants: Variant[]; value: ProductGallery; onChange: (value: ProductGallery) => void;
}) {
  const [color, setColor] = useState("");
  const colors = [...new Set(variants.map(variantColor).filter((c): c is string => Boolean(c)))];
  const current = color ? value.colors[color] : value.default;
  const inherited = galleryImages({ metadata: { gallery: value }, product_images: images, product_variants: variants }, color);
  const selected = (current ?? inherited.map((im) => im.id)).filter((id) => images.some((im) => im.id === id));
  const setIds = (ids: string[] | undefined) => {
    if (!color) { onChange({ ...value, default: ids }); return; }
    const next = { ...value.colors };
    if (ids) next[color] = ids; else delete next[color];
    onChange({ ...value, colors: next });
  };
  const move = (index: number, direction: number) => {
    const next = [...selected]; const target = index + direction;
    const a = next[index], b = next[target];
    if (!a || !b) return;
    next[index] = b; next[target] = a; setIds(next);
  };
  return <section aria-label="Foto's per kleur" className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <label className="space-y-1 text-sm font-medium">Kleur
        <select aria-label="Fotoselectie voor kleur" className="block rounded-sm border border-input bg-background p-2" value={color} onChange={(e) => setColor(e.target.value)}>
          <option value="">Standaardfoto's</option>
          {colors.map((c) => <option value={c} key={c}>{prettyValue(c)}</option>)}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm"><Switch aria-label="Eigen fotoselectie" checked={Boolean(current)} disabled={!images.length} onCheckedChange={(checked) => setIds(checked ? inherited.map((im) => im.id) : undefined)} /> Eigen fotoselectie</label>
    </div>
    {current && <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {images.map((im, index) => <label key={im.id} className={`relative cursor-pointer overflow-hidden rounded-sm border ${selected.includes(im.id) ? "border-primary ring-1 ring-primary" : "border-border"}`}>
        <img src={imgUrl(im.url, 300)} alt={im.alt_text ?? `Foto ${index + 1}`} className="aspect-[4/5] w-full object-cover" />
        <span className="flex items-center gap-2 p-2 text-xs"><Checkbox aria-label={`Toon foto ${index + 1}`} checked={selected.includes(im.id)} disabled={selected.length === 1 && selected.includes(im.id)} onCheckedChange={(checked) => setIds(checked ? [...selected, im.id] : selected.filter((id) => id !== im.id))} /> Foto {index + 1}</span>
      </label>)}
    </div>}
    <div>
      <h3 className="mb-2 text-sm font-medium">Zichtbare foto's · {selected.length}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {selected.map((id, index) => {
          const im = images.find((image) => image.id === id);
          if (!im) return null;
          return <div key={id} className="w-28 shrink-0 space-y-1">
            <img src={imgUrl(im.url, 200)} alt={im.alt_text ?? `Foto ${index + 1}`} className="aspect-[4/5] w-full rounded-sm object-cover" />
            <p className="text-xs font-medium">{index === 0 ? "Eerste foto" : `Foto ${index + 1}`}</p>
            {current && <div className="flex gap-1">
              <Button variant="outline" size="icon" className="size-7" disabled={index === 0} title="Naar voren" aria-label={`Foto ${index + 1} naar voren`} onClick={() => move(index, -1)}><ArrowLeft /></Button>
              <Button variant="outline" size="icon" className="size-7" disabled={index === selected.length - 1} title="Naar achteren" aria-label={`Foto ${index + 1} naar achteren`} onClick={() => move(index, 1)}><ArrowRight /></Button>
            </div>}
          </div>;
        })}
      </div>
    </div>
  </section>;
}