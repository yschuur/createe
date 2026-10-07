import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { formatPrice, imgUrl, isSoldOut, priceRange, prettyValue, type ProductWithRelations } from "@/lib/shop";

// Swatch colors based on the original CREATEE configurator palette.
const SWATCH: Record<string, string> = {
  antraciet: "#5e6065", beige: "#d7c4a5", "leaf-green": "#41835f", "luxe-white": "#ffffff", navy: "#38526a",
  "oceaan-blauw": "#4d708f", "off-white": "#e9decb", sand: "#d7c4a5", vanille: "#efe3c4", zwart: "#000000",
};

export function ProductCard({ product, index = 0 }: { product: ProductWithRelations; index?: number }) {
  const imgs = product.product_images;
  const { min, compareAt } = priceRange(product);
  const soldOut = isSoldOut(product);
  const colors = Array.from(new Set(product.product_variants.map((v) => v.color).filter((c): c is string => Boolean(c))));
  const colorImage = (c: string) => {
    const ids = new Set(product.product_variants.filter((v) => v.color === c).map((v) => v.id));
    return imgs.find((i) => i.variant_id && ids.has(i.variant_id));
  };
  const [active, setActive] = useState<string | null>(null);
  const activeImg = active ? colorImage(active) : undefined;
  const tilt = index % 3 === 0 ? "md:-rotate-1" : index % 3 === 1 ? "md:rotate-1" : "";
  return (
    <div className="group block">
      <div className={`relative aspect-[4/5] overflow-hidden rounded-sm bg-card shadow-sm transition-transform duration-300 group-hover:rotate-0 ${tilt}`}>
        <Link to="/products/$handle" params={{ handle: product.slug }} className="absolute inset-0" aria-label={product.name}>
          {activeImg ? (
            <img src={imgUrl(activeImg.url, 700)} alt={activeImg.alt_text ?? `${product.name} in ${prettyValue(active)}`} className="absolute inset-0 h-full w-full object-cover" />
          ) : <>
            {imgs[0] && <img src={imgUrl(imgs[0].url, 700)} alt={imgs[0].alt_text ?? product.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0" />}
            {(imgs[1] ?? imgs[0]) && <img src={imgUrl((imgs[1] ?? imgs[0])?.url, 700)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />}
          </>}
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1">
          {compareAt && <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase text-accent-foreground">Sale</span>}
          {product.tags.some((t) => t.toLowerCase() === "nieuw") && <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase text-primary-foreground">Nieuw</span>}
          {soldOut && <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold uppercase text-background">Uitverkocht</span>}
        </div>
        {colors.length > 1 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 rounded-full bg-background/85 px-2 py-1.5 backdrop-blur" onMouseLeave={() => setActive(null)}>
            {colors.map((c) => (
              <button key={c} type="button" title={prettyValue(c)} aria-label={`Bekijk in ${prettyValue(c)}`} aria-pressed={active === c}
                onMouseEnter={() => setActive(c)} onFocus={() => setActive(c)} onClick={() => setActive(active === c ? null : c)}
                className={`size-5 rounded-full border border-border transition-transform hover:scale-110 ${active === c ? "ring-2 ring-primary ring-offset-1" : ""}`}
                style={{ background: SWATCH[c] ?? "var(--muted)" }} />
            ))}
          </div>
        )}
      </div>
      <Link to="/products/$handle" params={{ handle: product.slug }} className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight">{product.name}</h3>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{product.product_type}{colors.length > 1 ? ` · ${colors.length} kleuren` : ""}</p>
        </div>
        <div className="shrink-0 text-right text-sm">
          <p className="font-medium">{formatPrice(min)}</p>
          {compareAt && <p className="text-xs text-muted-foreground line-through">{formatPrice(compareAt)}</p>}
        </div>
      </Link>
    </div>
  );
}
