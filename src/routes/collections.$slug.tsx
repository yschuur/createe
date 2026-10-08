import { sanitizeDescription, collectionQuery, filterSportShop, filterProducts, sortProducts } from "@/lib/shop";
import { createFileRoute, Link, notFound, redirect, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
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
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(collectionQuery(params.slug));
    if (!data) throw notFound();
    if ("redirect" in data && data.redirect) throw redirect({ to: "/collections/$slug", params: { slug: data.redirect.sport }, search: { collection: data.redirect.collection } });
    return { name: "sport" in data ? data.sport.name : "Shop" };
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.name ?? "Shop"} — CREATEE`;
    const description = `Shop de CREATEE ${loaderData?.name ?? ""} collectie: unieke designs, technische stoffen.`.replace("  ", " ");
    return { meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
    ] };
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

  const colors = [...new Set(base.flatMap((p) => p.product_variants.map((v) => v.color).filter((c): c is string => !!c)))].sort((a, b) => a.localeCompare(b, "nl"));
  const filtered = base.filter((p) => {
    if (avail === "in" && !p.product_variants.some(isPurchasable)) return false;
    if (avail === "out" && p.product_variants.some(isPurchasable)) return false;
    const price = priceRange(p).min;
    if (min != null && price < min) return false;
    if (max != null && price > max) return false;
    if (color && !p.product_variants.some((v) => v.color === color)) return false;
    return true;
  });
  const products = sortProducts(filtered, sort);

  const setSearch = (patch: Record<string, unknown>) =>
    navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ...patch }), replace: true });

  const chip = "rounded-full border border-border px-4 py-1.5 text-sm hover:border-primary";
  const on = "bg-primary text-primary-foreground border-primary";
  const select = "rounded-full border border-border bg-background px-4 py-1.5 text-sm";
  return (
    <ShopLayout cms="collection">
      <section data-section="collection-header" className="mx-auto max-w-7xl px-4 pt-12 md:px-8">
        <h1 className="text-5xl font-extrabold uppercase md:text-7xl">{data.sport.name}{active && <span className="block text-2xl md:text-3xl">{active.name}</span>}</h1>
        {active?.description && <div className="prose-shop mt-2 max-w-xl text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeDescription(active.description) }} />}
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Collecties">
          <Link to="/collections/$slug" params={{ slug }} search={{}} className={`${chip} ${!active ? on : ""}`}>Alles</Link>
          {data.collections.map((c) => <Link key={c.id} to="/collections/$slug" params={{ slug }} search={{ collection: c.slug }} className={`${chip} ${active?.id === c.id ? on : ""}`}>{c.name}</Link>)}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filters">
          <select aria-label="Sorteren" className={select} value={sort ?? "default"} onChange={(e) => setSearch({ sort: e.target.value === "default" ? undefined : e.target.value })}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>Sorteer: {s.label}</option>)}
          </select>
          <select aria-label="Beschikbaarheid" className={select} value={avail ?? ""} onChange={(e) => setSearch({ avail: e.target.value || undefined })}>
            <option value="">Beschikbaarheid: alles</option>
            <option value="in">Op voorraad</option>
            <option value="out">Uitverkocht</option>
          </select>
          <label className="flex items-center gap-1 text-sm">
            <span className="text-xs font-bold uppercase">Prijs</span>
            <input type="number" min={0} placeholder="van" className="w-20 rounded-full border border-border bg-background px-3 py-1.5 text-sm" value={min ?? ""} onChange={(e) => setSearch({ min: e.target.value ? Number(e.target.value) : undefined })} />
            <span>–</span>
            <input type="number" min={0} placeholder="tot" className="w-20 rounded-full border border-border bg-background px-3 py-1.5 text-sm" value={max ?? ""} onChange={(e) => setSearch({ max: e.target.value ? Number(e.target.value) : undefined })} />
          </label>
          {colors.length > 0 && (
            <select aria-label="Kleur" className={select} value={color ?? ""} onChange={(e) => setSearch({ color: e.target.value || undefined })}>
              <option value="">Kleur: alles</option>
              {colors.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
        </div>
      </section>
      <section data-section="collection-grid" className="mx-auto max-w-7xl px-4 pb-12 md:px-8">
        <div data-role="grid" className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {products.length === 0 && <p className="py-16 text-center text-muted-foreground">Nog geen producten in deze selectie.</p>}
      </section>
    </ShopLayout>
  );
}
