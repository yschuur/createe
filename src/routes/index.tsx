import { pageMeta, seoQuery } from "@/lib/seo";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef } from "react";
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
  head: ({ loaderData }) => ({ meta: pageMeta(loaderData, "home") }),
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(listProductsQuery()),
    context.queryClient.ensureQueryData(homepageQuery()),
    context.queryClient.ensureQueryData(pageSettingsQuery("home")),
    context.queryClient.ensureQueryData(pageSettingsQuery("global")),
    context.queryClient.ensureQueryData(pageSettingsQuery("footer")),
    context.queryClient.ensureQueryData(seoQuery()),
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
  const drag = useRef({ down: false, moved: false, startX: 0, scrollLeft: 0 });
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !row.current) return;
    drag.current = { down: true, moved: false, startX: e.clientX, scrollLeft: row.current.scrollLeft };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.down || !row.current) return;
    const dx = e.clientX - drag.current.startX;
    if (Math.abs(dx) > 4) {
      drag.current.moved = true;
      row.current.classList.add("dragging");
    }
    if (drag.current.moved) row.current.scrollLeft = drag.current.scrollLeft - dx;
  };
  const onPointerUp = () => {
    drag.current.down = false;
    row.current?.classList.remove("dragging");
  };
  const onClickCapture = (e: React.MouseEvent) => {
    if (!drag.current.moved) return;
    drag.current.moved = false;
    e.preventDefault();
    e.stopPropagation();
  };
  const cms = usePageSettings("home");
  const count = Math.round(cms.n("home-products", "count") ?? 12);
  const preferred = home.featured_slugs;
  const featured = [...products].sort((a,b) => {
    const rank = (slug: string) => { const i=preferred.findIndex(s=>s && slug.includes(s)); return i<0 ? preferred.length : i; };
    return rank(a.slug)-rank(b.slug);
  });
  const btn = "bg-shop-surface text-shop-ink";
  return <ShopLayout page="home">
    <section data-section="home-hero" className="home-hero relative grid grid-cols-1 grid-rows-2 overflow-hidden bg-primary md:grid-cols-2 md:grid-rows-1">
      <h1 className="sr-only">CREATEE | Golf & padel kleding</h1>
      <HeroPanel side={home.golf} video={golfVideo.url} poster={golfPoster.url} image={golfImg.url} alt="CREATEE golfkleding op de golfbaan" position="object-center" />
      <HeroPanel side={home.padel} video={padelVideo.url} poster={padelPoster.url} image={padelImg.url} alt="CREATEE padelkleding op de padelbaan" position="object-center" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-center gap-2 md:top-auto md:bottom-16 md:translate-y-0">
        <Button asChild variant="secondary" className={`pointer-events-auto ${btn}`}><a data-page-button="golf" href={home.golf.link}>{home.golf.label}</a></Button>
        {home.studio_button.label && <Button asChild variant="secondary" className={`pointer-events-auto ${btn}`}><a data-page-button="studio" href={home.studio_button.link}>{home.studio_button.label}</a></Button>}
        <Button asChild variant="secondary" className={`pointer-events-auto ${btn}`}><a data-page-button="padel" href={home.padel.link}>{home.padel.label}</a></Button>
      </div>
    </section>
    {home.show_ratings && <RatingsBar googleLabel={cms.t("home-ratings", "google_label")} trustLabel={cms.t("home-ratings", "trust_label")} trustUrl={cms.t("home-ratings", "trust_url")} googleUrl={cms.t("home-ratings", "google_url")} />}
    <section data-section="home-products" aria-label="CREATEE collectie" className="px-4 pt-7 pb-3 md:px-6">
      {home.carousel_title && <h2 className="mb-4 font-display text-2xl text-primary md:text-3xl">{home.carousel_title}</h2>}
      <div
        ref={row}
        className="home-product-carousel"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        onClickCapture={onClickCapture}
      >{featured.slice(0,count).map(p=><ProductCard key={p.id} product={p} index={2} />)}</div>
    </section>
  </ShopLayout>;
}
