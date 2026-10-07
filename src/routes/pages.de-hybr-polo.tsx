import { createFileRoute, Link } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import golf from "@/assets/hybr-golf.jpg.asset.json";
import detail from "@/assets/hybr-detail.jpg.asset.json";

export const Route = createFileRoute("/pages/de-hybr-polo")({
  head: () => ({ meta: [
    { title: "De HYBR™ polo — CREATEE" },
    { name: "description", content: "De HYBR™ polo: 360° stretch, premium finish, smart-collar en kreukvrij, ademend draagcomfort." },
    { property: "og:title", content: "De HYBR™ polo — CREATEE" },
    { property: "og:description", content: "Ontdek de ultieme veelzijdigheid van de CREATEE HYBR™ polo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: Hybr,
});

function Hybr() {
  return <ShopLayout><div className="bg-primary py-8 md:py-12">
    <section className="editorial-section grid md:grid-cols-2">
      <div className="flex flex-col justify-center p-7 sm:p-10 md:p-12"><p className="mb-5 text-xs font-semibold text-primary">HYBR™</p><h1 className="editorial-title text-4xl md:text-5xl">De<br />HYBR™<br />polo</h1><p className="editorial-copy mt-5 max-w-sm">Ontdek de ultieme veelzijdigheid. De HYBR™ Polo is ontwikkeld voor de golfer die prestatie niet zonder in te leveren op een volmaakte look. Onze unieke hybride stof biedt volledige bewegingsvrijheid, maar keert daarna direct terug naar de perfecte pasvorm. Ervaar het comfort van een sportpolo met de uitstraling van premium kwaliteit.</p><div className="mt-6 flex flex-wrap gap-3"><Button asChild><Link to="/collections/$slug" params={{ slug: "polos" }}>Ontdek HYBR</Link></Button><Button asChild variant="outline"><Link to="/design-studio">Personaliseer nu</Link></Button></div></div>
      <img src={golf.url} alt="Golfer in de groene CREATEE HYBR polo" className="aspect-square h-full w-full object-cover" />
    </section>
    <section className="editorial-section mt-4 grid md:grid-cols-2"><img src={detail.url} alt="Detail van de kraag en het CREATEE borduursel" loading="lazy" className="aspect-square h-full w-full object-cover" /><div className="flex flex-col justify-center p-7 sm:p-10 md:p-12"><h2 className="editorial-title mb-6 text-2xl">De kracht van<br />HYBR™ technologie</h2><dl className="space-y-5">{[
      ["360° stretch", "Maximale flexibiliteit voor een krachtige swing, waarna de stof direct weer herstelt naar de perfecte fit. Volledige vrijheid, zonder vormverlies."],
      ["Premium finish", "Vergeet de glimmende, plastic look van standaard sportpolo’s. Ervaar een rijke, matte textuur met luxe micro-details voor een verfijnde uitstraling."],
      ["Smart-collar", "Een kraag die nooit inzakt. Of je nu afslaat of proost op de overwinning, je ziet er de hele dag haarscherp uit."],
      ["Kreukvrij & ademend", "Optimale ventilatie en kreukvrij. Zelfs na 18 holes zie je er fris uit."],
    ].map(([title, text]) => <div key={title}><dt className="mb-1 text-sm font-bold uppercase text-primary">{title}</dt><dd className="text-sm leading-relaxed">{text}</dd></div>)}</dl></div></section>
  </div></ShopLayout>;
}