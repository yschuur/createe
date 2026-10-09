import { Link } from "@tanstack/react-router";
import { productColor } from "@/lib/product-colors";
import { galleryImages } from "@/lib/product-gallery";
import { formatPrice, imgUrl, prettyValue, priceRange, type ProductWithRelations } from "@/lib/shop";
import { arrangeMixed, type Section, type SectionItem } from "@/lib/collection-layout";

type Show = { name: boolean; material: boolean; price: boolean; colors: boolean };
type Card = { p: ProductWithRelations; item: SectionItem };

const material = (p: ProductWithRelations) => p.fabric || p.product_type || "";
const colorsOf = (p: ProductWithRelations) => Array.from(new Set(p.product_variants.map((v) => v.color).filter((c): c is string => !!c)));
const imageOf = ({ p, item }: Card, w: number) => item.image || (galleryImages(p)[0] ? imgUrl(galleryImages(p)[0]!.url, w) : "");

function Swatches({ p }: { p: ProductWithRelations }) {
  const cs = colorsOf(p);
  if (cs.length < 2) return null;
  return <div className="flex gap-1 rounded-sm bg-background/90 p-1">{cs.slice(0, 5).map((c) => <span key={c} title={prettyValue(c)} className="size-4 rounded-[2px] border border-border" style={{ background: productColor(c) }} />)}</div>;
}

export function LargeCard({ card, show, className = "" }: { card: Card; show: Show; className?: string }) {
  const { p, item } = card;
  const src = imageOf(card, 1100);
  return (
    <Link to="/products/$handle" params={{ handle: p.slug }} className={`group relative block aspect-[4/5] overflow-hidden bg-card ${className}`} aria-label={p.name}>
      {src && <img src={src} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-95" />}
      {item.label && <span className="absolute left-3 top-3 bg-background/90 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">{item.label}</span>}
      <div className="cs-large-shade absolute inset-x-0 bottom-0 p-4 pt-20 text-background">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            {show.name && <h3 className="font-display truncate text-lg font-semibold @2xl:text-xl">{p.name}</h3>}
            {show.material && <p className="truncate text-xs uppercase tracking-wider opacity-85">{material(p)}</p>}
          </div>
          {show.price && <p className="shrink-0 text-sm">{formatPrice(priceRange(p).min)}</p>}
        </div>
        {show.colors && <div className="mt-2 flex"><Swatches p={p} /></div>}
      </div>
    </Link>
  );
}

export function SmallCard({ card, show }: { card: Card; show: Show }) {
  const { p, item } = card;
  const src = imageOf(card, 600);
  return (
    <Link to="/products/$handle" params={{ handle: p.slug }} className="group block min-w-0">
      <div className="relative aspect-[10/9] overflow-hidden bg-secondary">
        {src && <img src={src} alt={p.name} loading="lazy" className="absolute inset-0 h-full w-full object-cover transition-opacity group-hover:opacity-95" />}
        {item.label && <span className="absolute left-2 top-2 bg-background/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em]">{item.label}</span>}
        {show.colors && <div className="absolute bottom-2 left-2"><Swatches p={p} /></div>}
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        {show.name && <h3 className="font-display min-w-0 truncate text-sm font-semibold">{p.name}</h3>}
        {show.price && <p className="shrink-0 text-xs">{formatPrice(priceRange(p).min)}</p>}
      </div>
      {show.material && <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">{material(p)}</p>}
    </Link>
  );
}

const cols: Record<number, string> = { 1: "@2xl:grid-cols-1", 2: "@2xl:grid-cols-2", 3: "@2xl:grid-cols-3", 4: "@2xl:grid-cols-3 @5xl:grid-cols-4", 5: "@2xl:grid-cols-3 @5xl:grid-cols-5", 6: "@2xl:grid-cols-4 @5xl:grid-cols-6" };

/** Renders one product/banner section. `products` is the currently visible (filtered) list; hidden ones are skipped. */
export function CollectionSection({ s, products, used, alt }: { s: Section; products: ProductWithRelations[]; used: Set<string>; alt: string }) {
  if (s.hidden) return null;
  if (s.type === "banner") {
    if (!s.desktop) return null;
    return <section data-section="collection-banner" className="w-full">
      <img src={s.desktop} alt={alt} className={`block h-auto w-full ${s.mobile ? "hidden @2xl:block" : ""}`} />
      {s.mobile && <img src={s.mobile} alt={alt} className="block h-auto w-full @2xl:hidden" />}
    </section>;
  }
  const byId = new Map(products.map((p) => [p.id, p]));
  let cards: Card[];
  if (s.type === "regular" && s.source === "auto") {
    cards = products.filter((p) => !used.has(p.id)).map((p) => ({ p, item: { productId: p.id } }));
    if (s.limit) cards = cards.slice(0, s.limit);
  } else {
    cards = s.items.flatMap((item) => { const p = byId.get(item.productId); return p ? [{ p, item }] : []; });
  }
  cards.forEach((c) => used.add(c.p.id));
  if (!cards.length) return null;
  const wrap = "mx-auto max-w-7xl px-4 py-5 md:px-8";

  if (s.type === "regular") return <section className={wrap}><div className={`grid grid-cols-2 gap-x-3 gap-y-6 @2xl:gap-x-4 ${cols[s.columns]}`}>{cards.map((c) => <SmallCard key={c.p.id} card={c} show={s.show} />)}</div></section>;
  if (s.type === "featured") return <section className={wrap}><div className={`grid grid-cols-1 gap-3 @2xl:gap-4 ${cols[s.columns]}`}>{cards.map((c) => <LargeCard key={c.p.id} card={c} show={s.show} />)}</div></section>;

  const { large, small } = arrangeMixed(s.layout, cards.map((c) => ({ ...c, size: c.item.size })));
  if (s.layout === "small") return <section className={wrap}><div className={`grid grid-cols-2 gap-x-3 gap-y-6 @2xl:gap-x-4 ${cols[s.columns]}`}>{small.map((c) => <SmallCard key={c.p.id} card={c} show={s.show} />)}</div></section>;
  if (s.layout === "large") return <section className={wrap}><div className={`grid grid-cols-1 gap-3 @2xl:gap-4 ${cols[s.columns]}`}>{large.map((c) => <LargeCard key={c.p.id} card={c} show={s.show} />)}</div></section>;
  const one = s.layout !== "2l-4s";
  const lg = one
    ? `col-span-2 @2xl:col-span-2 @2xl:row-span-2 @5xl:col-span-3 ${s.layout === "1l-right" ? "@2xl:col-start-3 @5xl:col-start-4 @2xl:row-start-1" : ""}`
    : "col-span-2 @2xl:col-span-2 @2xl:row-span-2";
  return <section className={wrap}>
    <div className="grid grid-flow-row-dense grid-cols-2 gap-x-3 gap-y-6 @2xl:grid-cols-4 @2xl:gap-x-4 @5xl:grid-cols-6">
      {large.map((c) => <LargeCard key={c.p.id} card={c} show={s.show} className={`${lg} @2xl:aspect-auto @2xl:h-full @2xl:min-h-[28rem]`} />)}
      {small.map((c) => <SmallCard key={c.p.id} card={c} show={s.show} />)}
    </div>
  </section>;
}

/** Renders a list of sections; product sections share a used-set so auto sections show the rest. */
export function CollectionSections({ sections, products, alt }: { sections: Section[]; products: ProductWithRelations[]; alt: string }) {
  const used = new Set<string>();
  return <>{sections.map((s) => <CollectionSection key={s.id} s={s} products={products} used={used} alt={alt} />)}</>;
}
