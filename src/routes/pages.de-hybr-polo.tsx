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
  return <ShopLayout page="story"><div className="about-magazine">
    <section data-section="hybr-1" className="about-band bg-muted">
      <div className="about-heading-grid"><div><p className="about-kicker text-primary">CREATEE · Signature HYBR™</p><h1 className="about-headline">De HYBR™<br />polo.</h1></div><div className="about-heading-aside"><h2 className="about-secondary-title text-primary">Ultieme<br />veelzijdigheid.</h2><p className="about-lead italic">Het comfort van een sportpolo met de uitstraling van premium kwaliteit.</p></div></div>
      <div className="about-media-grid"><img src={golf.url} alt="Golfer in de groene CREATEE HYBR polo" className="about-portrait" /><div className="about-media-copy"><p className="about-lead">Ontdek de ultieme veelzijdigheid. De HYBR™ Polo is ontwikkeld voor de golfer die prestatie niet zonder in te leveren op een volmaakte look. Onze unieke hybride stof biedt volledige bewegingsvrijheid, maar keert daarna direct terug naar de perfecte pasvorm. Ervaar het comfort van een sportpolo met de uitstraling van premium kwaliteit.</p><div className="mt-8 flex flex-wrap gap-3"><Button asChild><Link to="/collections/$slug" params={{ slug: "polos" }}>Ontdek HYBR</Link></Button><Button asChild variant="outline"><Link to="/design-studio">Personaliseer nu</Link></Button></div></div></div>
    </section>
    <section data-section="hybr-2" className="bg-primary text-primary-foreground">
      <div className="about-band about-technology-heading"><p className="about-kicker">De details maken het verschil</p><h2 className="about-section-title">De kracht van<br />HYBR™ technologie</h2></div>
      <div className="about-band bg-shop-surface text-shop-ink about-technology-grid"><img src={detail.url} alt="Detail van de kraag en het CREATEE borduursel" loading="lazy" className="about-history-image" /><dl className="about-features">{[
        ["360° stretch", "Maximale flexibiliteit voor een krachtige swing, waarna de stof direct weer herstelt naar de perfecte fit. Volledige vrijheid, zonder vormverlies."],
        ["Premium finish", "Vergeet de glimmende, plastic look van standaard sportpolo’s. Ervaar een rijke, matte textuur met luxe micro-details voor een verfijnde uitstraling."],
        ["Smart-collar", "Een kraag die nooit inzakt. Of je nu afslaat of proost op de overwinning, je ziet er de hele dag haarscherp uit."],
        ["Kreukvrij & ademend", "Optimale ventilatie en kreukvrij. Zelfs na 18 holes zie je er fris uit."],
      ].map(([title, text], i) => <div key={title}><dt className="text-primary"><span className="about-feature-number" aria-hidden="true">0{i + 1}</span>{title}</dt><dd>{text}</dd></div>)}</dl></div>
    </section>
  </div></ShopLayout>;
}
