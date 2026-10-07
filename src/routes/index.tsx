import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Logo } from "@/components/Logo";
import { imgUrl, listProductsQuery, type ProductWithRelations } from "@/lib/shop";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CREATEE — Golf & padel kleding met een knipoog" },
      { name: "description", content: "Polo's en T-shirts van organisch katoen voor golf en padel. Fairway to Heaven, Harry Putter, Bogeymian Rhapsody en meer." },
      { property: "og:title", content: "CREATEE — Golf & padel kleding met een knipoog" },
      { property: "og:description", content: "Polo's en T-shirts van organisch katoen voor golf en padel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listProductsQuery()),
  component: Home,
});

function Home() {
  const { data: products } = useSuspenseQuery(listProductsQuery());
  const hero = products.filter((p) => p.product_images.length).slice(0, 3);
  const polos = products.filter((p) => p.product_category?.includes("Polos"));
  const tees = products.filter((p) => !p.product_category?.includes("Polos"));

  return (
    <ShopLayout>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:px-8 md:py-24">
          <div className="space-y-6">
            <p className="text-xs uppercase tracking-[0.3em] opacity-80">Golf · Padel · 19e hole</p>
            <h1 className="text-5xl font-extrabold leading-[0.95] md:text-7xl">
              Speel serieus.<br /><span className="italic font-normal text-accent">Draag het niet.</span>
            </h1>
            <p className="max-w-md opacity-85">Polo's en tees met woordgrappen die je flightgenoten pas op de derde hole doorhebben.</p>
            <div className="flex flex-wrap gap-3">
              <Link to="/collections/$slug" params={{ slug: "golf" }} className="rounded-sm bg-accent px-6 py-3 font-semibold text-accent-foreground hover:opacity-90">Shop golf</Link>
              <Link to="/collections/$slug" params={{ slug: "padel" }} className="rounded-sm border border-primary-foreground/40 px-6 py-3 font-semibold hover:bg-primary-foreground/10">Shop padel</Link>
            </div>
          </div>
          <div className="relative h-[420px] md:h-[520px]">
            {hero.map((p, i) => (
              <Link
                key={p.id}
                to="/products/$handle"
                params={{ handle: p.slug }}
                className="absolute w-[55%] rounded-sm bg-card p-2 pb-8 shadow-2xl transition-transform hover:z-10 hover:scale-105"
                style={{ left: `${i * 22}%`, top: `${[8, 0, 16][i]}%`, transform: `rotate(${[-6, 3, -2][i]}deg)` }}
              >
                <img src={imgUrl(p.product_images[0].url, 600)} alt={p.name} className="aspect-[4/5] w-full object-cover" />
                <p className="absolute bottom-2 left-3 font-display text-sm text-card-foreground">{p.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Section title="Polo's" subtitle="HYBR™ — technisch genoeg voor 18 holes, net genoeg voor de bar." slug="polos" products={polos.slice(0, 8)} />

      <section className="mx-4 my-8 rounded-sm bg-accent px-6 py-14 text-center text-accent-foreground md:mx-8">
        <Logo variant="favicon" className="mx-auto mb-4 h-14" />
        <h2 className="text-3xl font-extrabold md:text-5xl">Eigen design voor je flight of club?</h2>
        <p className="mx-auto mt-3 max-w-xl">De CREATEE Design Studio werkt drie unieke voorstellen voor je uit, inclusief twee feedbackrondes.</p>
        <Link to="/design-studio" className="mt-6 inline-block rounded-sm bg-primary px-6 py-3 font-semibold text-primary-foreground">Naar de Design Studio</Link>
      </section>

      <Section title="T-shirts" subtitle="Organisch katoen, bedrukt met een knipoog." slug="t-shirts" products={tees.slice(0, 8)} />
    </ShopLayout>
  );
}

function Section({ title, subtitle, slug, products }: { title: string; subtitle: string; slug: string; products: ProductWithRelations[] }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-4xl font-extrabold md:text-5xl">{title}</h2>
          <p className="mt-1 text-muted-foreground">{subtitle}</p>
        </div>
        <Link to="/collections/$slug" params={{ slug }} className="shrink-0 text-sm font-semibold underline underline-offset-4">Bekijk alles</Link>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </section>
  );
}
