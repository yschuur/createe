import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { listProductsQuery } from "@/lib/shop";
import golf from "@/assets/home-golf.jpg.asset.json";
import padel from "@/assets/home-padel.jpg.asset.json";

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
  const row = useRef<HTMLDivElement>(null);
  const preferred = ["padelo-picasso", "red-hot-chili-putters", "bogeymian-rhapsody", "bandeja-vu", "at-the-19th"];
  const featured = [...products].sort((a,b) => {
    const rank = (slug: string) => { const i=preferred.findIndex(s=>slug.includes(s)); return i<0 ? preferred.length : i; };
    return rank(a.slug)-rank(b.slug);
  });
  return <ShopLayout>
    <section className="home-hero relative grid grid-cols-2 overflow-hidden bg-primary">
      <h1 className="sr-only">CREATEE — Golf & padel kleding</h1>
      <img src={golf.url} alt="CREATEE golfshirt op de golfbaan" className="h-full min-h-0 w-full object-cover object-[75%_center]" fetchPriority="high" />
      <img src={padel.url} alt="Padelo Picasso op de padelbaan" className="h-full min-h-0 w-full object-cover object-[30%_center]" fetchPriority="high" />
      <div className="absolute inset-x-0 bottom-10 flex justify-center gap-2 md:bottom-16">
        <Button asChild variant="secondary" className="bg-shop-surface text-shop-ink"><Link to="/collections/$slug" params={{slug:"golf"}}>Golf</Link></Button>
        <Button asChild variant="secondary" className="bg-shop-surface text-shop-ink"><Link to="/design-studio">Studio</Link></Button>
        <Button asChild variant="secondary" className="bg-shop-surface text-shop-ink"><Link to="/collections/$slug" params={{slug:"padel"}}>Padel</Link></Button>
      </div>
    </section>
    <div className="flex justify-center gap-6 bg-primary px-4 py-3 text-xs text-primary-foreground"><span>Google ★★★★★</span><span>Trustpilot ★★★★★</span></div>
    <section aria-label="CREATEE collectie" className="px-4 py-7 md:px-6">
      <div ref={row} className="home-product-carousel">{featured.slice(0,12).map(p=><ProductCard key={p.id} product={p} index={2} />)}</div>
      <div className="mt-6 flex items-center justify-between gap-3"><Link to="/collections/$slug" params={{slug:"golf"}} className="text-sm font-medium underline underline-offset-4">Bekijk de collectie</Link><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Vorige producten" onClick={()=>row.current?.scrollBy({left:-row.current.clientWidth,behavior:"smooth"})}><ArrowLeft /></Button><Button variant="outline" size="icon" aria-label="Volgende producten" onClick={()=>row.current?.scrollBy({left:row.current.clientWidth,behavior:"smooth"})}><ArrowRight /></Button></div></div>
    </section>
  </ShopLayout>;
}
