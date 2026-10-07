import { sanitizeDescription, stripHtml } from "@/lib/shop";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { collectionQuery, collectionsQuery } from "@/lib/shop";

export const Route = createFileRoute("/collections/$slug")({
  loader: async ({ context, params }) => {
    const [data] = await Promise.all([
      context.queryClient.ensureQueryData(collectionQuery(params.slug)),
      context.queryClient.ensureQueryData(collectionsQuery()),
    ]);
    if (!data) throw notFound();
    return { name: data.collection.name, description: stripHtml(data.collection.description) };
  },
  head: ({ loaderData }) => {
    const title = `${loaderData?.name ?? "Collectie"} — CREATEE`;
    const description = loaderData?.description ?? "Bekijk de CREATEE collectie.";
    return {
      meta: [
        { title }, { name: "description", content: description },
        { property: "og:title", content: title }, { property: "og:description", content: description },
        { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CollectionPage,
  notFoundComponent: () => <ShopLayout><p className="py-24 text-center">Collectie niet gevonden.</p></ShopLayout>,
  errorComponent: () => <ShopLayout><p className="py-24 text-center">Collectie kon niet geladen worden.</p></ShopLayout>,
});

function CollectionPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(collectionQuery(slug));
  const { data: collections } = useSuspenseQuery(collectionsQuery());
  if (!data) return null;
  return (
    <ShopLayout>
      <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
        <h1 className="text-5xl font-extrabold md:text-7xl">{data.collection.name}</h1>
        {data.collection.description && <div className="prose-shop mt-2 max-w-xl text-muted-foreground" dangerouslySetInnerHTML={{ __html: sanitizeDescription(data.collection.description) }} />}
        <div className="mt-6 flex flex-wrap gap-2">
          {collections.map((c) => (
            <Link key={c.id} to="/collections/$slug" params={{ slug: c.slug }}
              className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-primary"
              activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}>
              {c.name}
            </Link>
          ))}
        </div>
        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
          {data.products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        {data.products.length === 0 && <p className="py-16 text-center text-muted-foreground">Nog geen producten in deze collectie.</p>}
      </section>
    </ShopLayout>
  );
}
