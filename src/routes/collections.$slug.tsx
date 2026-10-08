import { sanitizeDescription, collectionQuery, filterSportShop } from "@/lib/shop";
import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { z } from "zod";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";

const searchSchema = z.object({
  collection: z.string().max(100).optional().catch(undefined),
  tag: z.string().max(100).optional().catch(undefined),
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

function SportShopPage() {
  const { slug } = Route.useParams();
  const { collection, tag } = Route.useSearch();
  const { data } = useSuspenseQuery(collectionQuery(slug));
  if (!data || !("sport" in data) || !data.sport) return null;
  const active = data.collections.find((c) => c.slug === collection);
  const inColl = active ? new Set(data.links.filter((l) => l.collection_id === active.id).map((l) => l.product_id)) : undefined;
  const order = active ? new Map(data.links.filter((l) => l.collection_id === active.id).map((l) => [l.product_id, l.sort_order])) : null;
  const base = filterSportShop(data.products, data.sport.id, inColl);
  if (order) base.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const tags = [...new Set(base.flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b, "nl"));
  const products = tag ? base.filter((p) => p.tags.includes(tag)) : base;
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
        {tags.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Tags">
          <span className="text-xs font-bold uppercase">Tags</span>
          <Link to="/collections/$slug" params={{ slug }} search={{ collection }} className={`${chip} ${!tag ? on : ""}`}>Alle</Link>
          {tags.map((t) => <Link key={t} to="/collections/$slug" params={{ slug }} search={{ collection, tag: t }} className={`${chip} ${tag === t ? on : ""}`}>{t}</Link>)}
        </div>}
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
