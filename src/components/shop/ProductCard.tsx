import { Link } from "@tanstack/react-router";
import { formatPrice, imgUrl, isSoldOut, priceRange, type ProductWithRelations } from "@/lib/shop";

export function ProductCard({ product, index = 0 }: { product: ProductWithRelations; index?: number }) {
  const imgs = product.product_images;
  const { min, compareAt } = priceRange(product);
  const soldOut = isSoldOut(product);
  const colors = Array.from(new Set(product.product_variants.map((v) => v.color).filter(Boolean)));
  const tilt = index % 3 === 0 ? "md:-rotate-1" : index % 3 === 1 ? "md:rotate-1" : "";
  return (
    <Link to="/products/$handle" params={{ handle: product.slug }} className="group block">
      <div className={`relative aspect-[4/5] overflow-hidden rounded-sm bg-card shadow-sm transition-transform duration-300 group-hover:rotate-0 ${tilt}`}>
        {imgs[0] && (
          <img src={imgUrl(imgs[0].url, 700)} alt={imgs[0].alt_text ?? product.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 group-hover:opacity-0" />
        )}
        {(imgs[1] ?? imgs[0]) && (
          <img src={imgUrl((imgs[1] ?? imgs[0])?.url, 700)} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1">
          {compareAt && <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase text-accent-foreground">Sale</span>}
          {product.tags.some((t) => t.toLowerCase() === "nieuw") && <span className="rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold uppercase text-primary-foreground">Nieuw</span>}
          {soldOut && <span className="rounded-full bg-foreground px-2.5 py-1 text-[11px] font-bold uppercase text-background">Uitverkocht</span>}
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-lg leading-tight">{product.name}</h3>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{product.product_type}{colors.length > 1 ? ` · ${colors.length} kleuren` : ""}</p>
        </div>
        <div className="text-right text-sm">
          <p className="font-medium">{formatPrice(min)}</p>
          {compareAt && <p className="text-xs text-muted-foreground line-through">{formatPrice(compareAt)}</p>}
        </div>
      </div>
    </Link>
  );
}
