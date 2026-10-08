import { useQuery } from "@tanstack/react-query";
import { bannerHeightsQuery, bannersFor, bannersQuery } from "@/lib/collection-banners";
import { focusPosition } from "@/lib/image-focus";
import { sanitizeDescription, collectionQuery, filterSportShop, filterProducts, sortProducts } from "@/lib/shop";
import { colorGroupKey, colorGroupLabel, productColor } from "@/lib/product-colors";
import { createFileRoute, Link, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, SlidersHorizontal, X } from "lucide-react";
import { z } from "zod";
import { seoFrom, seoMeta, seoQuery } from "@/lib/seo";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";

const searchSchema = z.object({
  collection: z.string().max(100).optional().catch(undefined),
  sort: z.string().max(20).optional().catch(undefined),
  avail: z.string().max(20).optional().catch(undefined),
  min: z.number().optional().catch(undefined),
  max: z.number().optional().catch(undefined),
  color: z.string().max(60).optional().catch(undefined),
});

export const Route = createFileRoute("/collections/$slug")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ collection: search.collection }),
  loader: async ({ context, params, deps }) => {
    const data = await context.queryClient.ensureQueryData(collectionQuery(params.slug));
    if (!data) throw notFound();
    if ("redirect" in data && data.redirect) throw redirect({ to: "/collections/$slug", params: { slug: data.redirect.sport }, search: { collection: data.redirect.collection } });
    const seo = await context.queryClient.ensureQueryData(seoQuery());
    return { name: "sport" in data ? data.sport.name : "Shop", slug: params.slug, collection: deps.collection, seo };
  },
  head: ({ loaderData }) => {
    const def = { title: `${loaderData?.name ?? "Shop"} | CREATEE`, description: `Shop de CREATEE ${loaderData?.name ?? ""} collectie: unieke designs, technische stoffen.`.replace("  ", " ") };
    const sport = seoFrom(loaderData, `sport:${loaderData?.slug}`);
    const col = loaderData?.collection ? seoFrom(loaderData, `collection:${loaderData.collection}`) : {};
    return { meta: seoMeta({ title: col.title || sport.title, description: col.description || sport.description }, def) };
  },
  component: SportShopPage,
  notFoundComponent: () => <ShopLayout><p className="py-24 text-center">Collectie niet gevonden.</p></ShopLayout>,
  errorComponent: () => <ShopLayout><p className="py-24 text-center">Collectie kon niet geladen worden.</p></ShopLayout>,
});

const SORTS = [
  { id: "default", label: "Standaard" },
  { id: "alpha", label: "Alfabetisch" },
  { id: "price-asc", label: "Prijs: laag naar hoog" },
  { id: "price-desc", label: "Prijs: hoog naar laag" },
  { id: "date-desc", label: "Datum: nieuwste eerst" },
  { id: "date-asc", label: "Datum: oudste eerst" },
];

function SportShopPage() {
  const { slug } = Route.useParams();
  const { collection, sort, avail, min, max, color } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { data } = useSuspenseQuery(collectionQuery(slug));
  if (!data || !("sport" in data) || !data.sport) return null;
  const active = data.collections.find((c) => c.slug === collection);
  const inColl = active ? new Set(data.links.filter((l) => l.collection_id === active.id).map((l) => l.product_id)) : undefined;
  const order = active ? new Map(data.links.filter((l) => l.collection_id === active.id).map((l) => [l.product_id, l.sort_order])) : null;
  const base = filterSportShop(data.products, data.sport.id, inColl);
  if (order) base.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  const colors = [...new Set(base.flatMap((p) => p.product_variants.map((v) => v.color).filter((c): c is string => !!c)).map(colorGroupKey))].sort((a, b) => a.localeCompare(b, "nl"));
  const products = sortProducts(filterProducts(base, { avail, min, max, color }), sort);
  const hasFilters = !!avail || min != null || max != null || !!color || !!sort;

  const setSearch = (patch: Record<string, unknown>) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }), replace: true });

  const [drawerOpen, setDrawerOpen] = useState(false);
  const { data: bannerMap } = useQuery(bannersQuery());
  const banners = bannersFor(bannerMap ?? {}, data.sport.slug, active?.slug);
  const { data: heightMap } = useQuery(bannerHeightsQuery());
  const ownBanners = !!active && (bannerMap?.[active.slug] ?? []).some((b) => b.url);
  const bannerHeight = heightMap?.[ownBanners && active ? active.slug : data.sport.slug] ?? 0;
  const chip = "rounded-full border border-border px-4 py-1.5 text-sm hover:border-primary";
  const on = "bg-primary text-primary-foreground border-primary";
  return (
    <ShopLayout cms="collection">
      <section data-section="collection-header" className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
        <h1 className="text-5xl font-extrabold uppercase md:text-7xl">{data.sport.name}{active && <span className="block text-2xl md:text-3xl">{active.name}</span>}</h1>
        {active?.description && <div className="prose-shop mt-2 max-w-xl text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeDescription(active.description) }} />}
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Collecties">
          <Link to="/collections/$slug" params={{ slug }} search={{}} className={`${chip} ${!active ? on : ""}`}>Alles</Link>
          {data.collections.map((c) => <Link key={c.id} to="/collections/$slug" params={{ slug }} search={{ collection: c.slug }} className={`${chip} ${active?.id === c.id ? on : ""}`}>{c.name}</Link>)}
        </div>
      </section>
      <div data-section="collection-filters" className="mt-8 bg-[#F5F5F5]">
        {/* Mobiel: filterknop die de zijbalk opent */}
        <div className="flex items-center justify-between px-4 py-3.5 md:hidden">
          <button type="button" onClick={() => setDrawerOpen(true)} aria-haspopup="dialog"
            className="flex items-center gap-2 text-[15px] font-medium hover:opacity-70">
            <SlidersHorizontal className="h-4 w-4" />
            Filter{hasFilters ? ` (${[avail, min != null || max != null ? "prijs" : "", color, sort].filter(Boolean).length})` : ""}
          </button>
          <span className="text-sm text-foreground/80">{products.length} artikelen</span>
        </div>
        {/* Desktop: horizontale filterbalk */}
        <div className="mx-auto hidden max-w-7xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3.5 md:flex md:px-8" aria-label="Filters">
          <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
            <FilterMenu label="Beschikbaarheid" active={!!avail}>
              {[{ v: "", l: "Alles" }, { v: "in", l: "Op voorraad" }, { v: "out", l: "Uitverkocht" }].map((o) => (
                <button key={o.v} type="button" onClick={() => setSearch({ avail: o.v || undefined })}
                  className={`block w-full px-4 py-2 text-left text-sm hover:bg-black/5 ${(avail ?? "") === o.v ? "font-semibold" : ""}`}>{o.l}</button>
              ))}
            </FilterMenu>
            <FilterMenu label="Prijs" active={min != null || max != null}>
              <div className="flex items-center gap-2 px-4 py-3">
                <input type="number" min={0} placeholder="van" aria-label="Prijs van" className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm" value={min ?? ""} onChange={(e) => setSearch({ min: e.target.value ? Number(e.target.value) : undefined })} />
                <span>–</span>
                <input type="number" min={0} placeholder="tot" aria-label="Prijs tot" className="w-20 rounded border border-border bg-background px-2 py-1.5 text-sm" value={max ?? ""} onChange={(e) => setSearch({ max: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </FilterMenu>
            {colors.length > 0 && (
              <FilterMenu label="Kleur" active={!!color}>
                <div className="flex flex-wrap gap-2 px-4 py-3" role="listbox" aria-label="Kleur">
                  {colors.map((c) => (
                    <button key={c} type="button" title={colorGroupLabel(c)} aria-label={colorGroupLabel(c)} aria-pressed={!!color && colorGroupKey(color) === c} onClick={() => setSearch({ color: !!color && colorGroupKey(color) === c ? undefined : c })}
                      className={`h-7 w-7 rounded-full border transition ${!!color && colorGroupKey(color) === c ? "ring-2 ring-primary ring-offset-2" : "border-black/15 hover:scale-110"}`}
                      style={{ background: productColor(c) }} />
                  ))}
                </div>
              </FilterMenu>
            )}
            {hasFilters && (
              <button type="button" onClick={() => setSearch({ avail: undefined, min: undefined, max: undefined, color: undefined, sort: undefined })}
                className="flex items-center gap-1.5 text-[15px] font-semibold underline underline-offset-4 hover:opacity-70">
                <X className="h-4 w-4" />
                Alles wissen
              </button>
            )}
          </div>
          <div className="ml-auto flex items-center gap-x-8">
            <span className="text-sm text-foreground/80">{products.length} artikelen</span>
            <FilterMenu label="Sorteren" active={!!sort} align="right">
              {SORTS.map((s) => (
                <button key={s.id} type="button" onClick={() => setSearch({ sort: s.id === "default" ? undefined : s.id })}
                  className={`block w-full whitespace-nowrap px-4 py-2 text-left text-sm hover:bg-black/5 ${(sort ?? "default") === s.id ? "font-semibold" : ""}`}>{s.label}</button>
              ))}
            </FilterMenu>
          </div>
        </div>
      </div>
      {drawerOpen && (
        <FilterDrawer
          count={products.length}
          colors={colors}
          avail={avail} min={min} max={max} color={color} sort={sort}
          hasFilters={hasFilters}
          setSearch={setSearch}
          onClose={() => setDrawerOpen(false)}
        />
      )}
      <section data-section="collection-grid" className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
        <div data-role="grid" className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {products.length === 0 && <p className="py-16 text-center text-muted-foreground">Nog geen producten in deze selectie.</p>}
      </section>
      {banners.length > 0 && (
        <section data-section="collection-banners" className="flex w-full gap-1" style={bannerHeight ? { height: `min(${bannerHeight}px, ${(bannerHeight / 14.4).toFixed(2)}vw)` } : undefined}>
          {banners.map((b, i) => {
            const im = <img src={b.url} alt={`CREATEE ${active?.name ?? data.sport.name}`} loading="lazy" className={`${bannerHeight ? "" : "aspect-[3/4] "}block h-full w-full object-cover transition-opacity hover:opacity-90`} style={{ objectPosition: b.focus ? focusPosition(b.focus) : undefined }} />;
            return <div key={i} className="h-full min-w-0 flex-1">{b.link ? <a href={b.link} className="block h-full">{im}</a> : im}</div>;
          })}
        </section>
      )}
    </ShopLayout>
  );
}

function FilterMenu({ label, active, align, children }: { label: string; active?: boolean; align?: "right"; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 text-[15px] ${active ? "font-semibold" : ""} hover:opacity-70`}>
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className={`absolute top-full z-30 mt-2 min-w-44 rounded-md border border-border bg-background py-1 shadow-lg ${align === "right" ? "right-0" : "left-0"}`}>
          {children}
        </div>
      )}
    </div>
  );
}

function DrawerSection({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between py-4 text-[15px] font-medium">
        {title}
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

function FilterDrawer({ count, colors, avail, min, max, color, sort, hasFilters, setSearch, onClose }: {
  count: number; colors: string[];
  avail?: string | undefined; min?: number | undefined; max?: number | undefined; color?: string | undefined; sort?: string | undefined;
  hasFilters: boolean;
  setSearch: (patch: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", esc);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", esc); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
      <button type="button" aria-label="Sluiten" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-[#F5F5F5] shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-2xl font-bold">Filter</h2>
          <button type="button" aria-label="Sluiten" onClick={onClose} className="p-1 hover:opacity-70"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5">
          <DrawerSection title="Beschikbaarheid">
            {[{ v: "in", l: "Op voorraad" }, { v: "out", l: "Niet op voorraad" }].map((o) => (
              <label key={o.v} className={`flex items-center gap-3 py-2 text-[15px] ${avail === o.v ? "" : "text-foreground/70"}`}>
                <input type="checkbox" checked={avail === o.v} onChange={() => setSearch({ avail: avail === o.v ? undefined : o.v })}
                  className="h-5 w-5 rounded border-border accent-primary" />
                {o.l}
              </label>
            ))}
          </DrawerSection>
          <DrawerSection title="Prijs">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center rounded border border-border bg-background px-3 py-2.5">
                <span className="mr-2 text-foreground/60">€</span>
                <input type="number" min={0} placeholder="0" aria-label="Prijs van" className="w-full bg-transparent text-sm outline-none" value={min ?? ""} onChange={(e) => setSearch({ min: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
              <span className="text-sm text-foreground/60">aan</span>
              <div className="flex flex-1 items-center rounded border border-border bg-background px-3 py-2.5">
                <span className="mr-2 text-foreground/60">€</span>
                <input type="number" min={0} aria-label="Prijs tot" className="w-full bg-transparent text-sm outline-none" value={max ?? ""} onChange={(e) => setSearch({ max: e.target.value ? Number(e.target.value) : undefined })} />
              </div>
            </div>
          </DrawerSection>
          {colors.length > 0 && (
            <DrawerSection title="Kleur">
              <div className="flex flex-wrap gap-2.5" role="listbox" aria-label="Kleur">
                {colors.map((c) => (
                  <button key={c} type="button" title={colorGroupLabel(c)} aria-label={colorGroupLabel(c)} aria-pressed={!!color && colorGroupKey(color) === c}
                    onClick={() => setSearch({ color: !!color && colorGroupKey(color) === c ? undefined : c })}
                    className={`h-9 w-9 rounded-sm border transition ${!!color && colorGroupKey(color) === c ? "ring-2 ring-primary ring-offset-2" : "border-black/20"}`}
                    style={{ background: productColor(c) }} />
                ))}
              </div>
            </DrawerSection>
          )}
          <div className="flex items-center justify-between py-5">
            <span className="text-xl font-bold">Sorteren</span>
            <select aria-label="Sorteren" value={sort ?? "default"} onChange={(e) => setSearch({ sort: e.target.value === "default" ? undefined : e.target.value })}
              className="rounded border border-border bg-background px-3 py-2 text-sm">
              {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          {hasFilters && (
            <button type="button" onClick={() => setSearch({ avail: undefined, min: undefined, max: undefined, color: undefined, sort: undefined })}
              className="mb-4 flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4 hover:opacity-70">
              <X className="h-4 w-4" />
              Alles wissen
            </button>
          )}
        </div>
        <div className="p-5">
          <button type="button" onClick={onClose}
            className="w-full rounded-full bg-foreground py-4 text-center text-[15px] font-semibold text-background hover:opacity-90">
            {count} artikelen weergeven
          </button>
        </div>
      </div>
    </div>
  );
}
