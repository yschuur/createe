import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { PageText } from "@/components/shop/PageText";
import { isPolicySlug, policiesQuery, defaultPolicies } from "@/lib/policies";
import { pageSettingsQuery } from "@/lib/page-settings";
import { seoFrom, seoMeta, seoQuery } from "@/lib/seo";

export const Route = createFileRoute("/policies/$slug")({
  loader: async ({ params, context }) => {
    if (!isPolicySlug(params.slug)) throw notFound();
    await Promise.all([context.queryClient.ensureQueryData(policiesQuery()), context.queryClient.ensureQueryData(pageSettingsQuery("global"))]);
    const seo = await context.queryClient.ensureQueryData(seoQuery());
    return { slug: params.slug, seo };
  },
  head: ({ params, loaderData }) => {
    const p = isPolicySlug(params.slug) ? defaultPolicies[params.slug] : null;
    if (!p) return { meta: [{ title: "Niet gevonden | CREATEE" }, { name: "robots", content: "noindex" }] };
    return { meta: seoMeta(seoFrom(loaderData, `policy:${params.slug}`), { title: `${p.title} | CREATEE`, description: `${p.title} van CREATEE: alles wat je moet weten over ${p.label.toLowerCase()}.` }, { type: "article", card: "summary" }) };
  },
  notFoundComponent: () => <ShopLayout><p className="py-24 text-center">Pagina niet gevonden.</p></ShopLayout>,
  component: PolicyPage,
});

function PolicyPage() {
  const { slug } = Route.useLoaderData();
  const { data } = useSuspenseQuery(policiesQuery());
  const p = data[slug];
  return <ShopLayout>
    <article className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="mb-8 text-center font-heading text-3xl font-bold uppercase text-primary"><PageText as="span" inline value={p.title} /></h1>
      <PageText value={p.body} className="policy-body space-y-4 leading-relaxed [&_a]:underline [&_h2]:mt-8 [&_h2]:font-bold [&_h3]:mt-6 [&_h3]:font-bold [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6" />
    </article>
  </ShopLayout>;
}
