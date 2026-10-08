import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { ProductCard } from "@/components/shop/ProductCard";
import { RatingsBar } from "@/components/shop/RatingsBar";
import { Button } from "@/components/ui/button";
import { listProductsQuery } from "@/lib/shop";
import { homepageQuery, type HeroSide } from "@/lib/site-settings";
import { pageSettingsQuery, usePageSettings } from "@/lib/page-settings";
import golfImg from "@/assets/home-golf.jpg.asset.json";
import padelImg from "@/assets/home-padel.jpg.asset.json";
import golfVideo from "@/assets/hero-golf.mp4.asset.json";
import padelVideo from "@/assets/hero-padel.mp4.asset.json";
import golfPoster from "@/assets/hero-golf-poster.jpg.asset.json";
import padelPoster from "@/assets/hero-padel-poster.jpg.asset.json";

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
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(listProductsQuery()),
    context.queryClient.ensureQueryData(homepageQuery()),
    context.queryClient.ensureQueryData(pageSettingsQuery("home")),
    context.queryClient.ensureQueryData(pageSettingsQuery("global")),
  ]),
  component: Home,
});

function HeroPanel({ side, video, poster, image, alt, position }: { side: HeroSide; video: string; poster: string; image: string; alt: string; position: string }) {
  return <a href={side.link} className="group relative block h-full min-h-0 overflow-hidden" aria-label={side.label}>
    {side.show_video
      ? <video key={side.video_url || video} src={side.video_url || video} poster={side.video_url ? undefined : poster} autoPlay muted loop playsInline preload="metadata" aria-label={alt} className={`h-full w-full object-cover ${position}`} />
      : <img src={side.image_url || image} alt={alt} className={`h-full w-full object-cover ${position}`} fetchPriority="high" />}
    <span data-role="overlay" className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent" />
  </a>;
}

function Home() {
  const { data: products } = useSuspenseQuery(listProductsQuery());
  const { data: home } = useSuspenseQuery(homepageQuery());
  const row = useRef<HTMLDivElement>(null);
  const cms = usePageSettings("home");
  const count = Math.round(cms.n("home-products", "count") ?? 12);
  const preferred = home.featured_slugs;
  const featured = [...products].sort((a,b) => {
    const rank = (slug: string) => { const i=preferred.findIndex(s=>s && slug.includes(s)); return i<0 ? preferred.length : i; };
    return rank(a.slug)-rank(b.slug);
  });
  const btn = "bg-shop-surface text-shop-ink";
  return <ShopLayout page="home">
    <section data-section="home-hero" className="home-hero relative grid grid-cols-2 overflow-hidden bg-primary">
      <h1 className="sr-only">CREATEE — Golf & padel kleding</h1>
      <HeroPanel side={home.golf} video={golfVideo.url} poster={golfPoster.url} image={golfImg.url} alt="CREATEE golfkleding op de golfbaan" position="object-center" />
      <HeroPanel side={home.padel} video={padelVideo.url} poster={padelPoster.url} image={padelImg.url} alt="CREATEE padelkleding op de padelbaan" position="object-center" />
      <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center gap-2 md:bottom-16">
        <Button asChild variant="secondary" className={`pointer-events-auto ${btn}`}><a data-page-button="golf" href={home.golf.link}>{home.golf.label}</a></Button>
        {home.studio_button.label && <Button asChild variant="secondary" className={`pointer-events-auto ${btn}`}><a data-page-button="studio" href={home.studio_button.link}>{home.studio_button.label}</a></Button>}
        <Button asChild variant="secondary" className={`pointer-events-auto ${btn}`}><a data-page-button="padel" href={home.padel.link}>{home.padel.label}</a></Button>
      </div>
    </section>
    {home.show_ratings && <RatingsBar googleLabel={cms.t("home-ratings", "google_label")} trustLabel={cms.t("home-ratings", "trust_label")} trustUrl={cms.t("home-ratings", "trust_url")} googleUrl={cms.t("home-ratings", "google_url")} />}
    <section data-section="home-products" aria-label="CREATEE collectie" className="px-4 py-7 md:px-6">
      {home.carousel_title && <h2 className="mb-5 font-display text-2xl text-primary md:text-3xl">{home.carousel_title}</h2>}
      <div ref={row} className="home-product-carousel">{featured.slice(0,count).map(p=><ProductCard key={p.id} product={p} index={2} />)}</div>
      <div className="mt-6 flex items-center justify-between gap-3"><a href={cms.t("home-products", "collection_url")} className="text-sm font-medium underline underline-offset-4">{home.collection_link_label}</a><div className="flex gap-2"><Button variant="outline" size="icon" aria-label="Vorige producten" onClick={()=>row.current?.scrollBy({left:-row.current.clientWidth,behavior:"smooth"})}><ArrowLeft /></Button><Button variant="outline" size="icon" aria-label="Volgende producten" onClick={()=>row.current?.scrollBy({left:row.current.clientWidth,behavior:"smooth"})}><ArrowRight /></Button></div></div>
    </section>
  </ShopLayout>;
}
