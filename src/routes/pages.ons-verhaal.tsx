import { createFileRoute, Link } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { AboutCollage } from "@/components/shop/AboutCollage";
import laptop from "@/assets/story-laptop.jpg.asset.json";
import fabric from "@/assets/story-fabric.jpg.asset.json";
import studio from "@/assets/story-creativity.jpg.asset.json";
import personal from "@/assets/story-personal.jpg.asset.json";

export const Route = createFileRoute("/pages/ons-verhaal")({
  head: () => ({ meta: [
    { title: "Ons verhaal — CREATEE" },
    { name: "description", content: "Exclusieve designs. Echte identiteit. Ontdek het verhaal, de missie en de kernwaarden van CREATEE." },
    { property: "og:title", content: "Ons verhaal — CREATEE" },
    { property: "og:description", content: "Premium kwaliteit, grenzeloze creativiteit en een persoonlijke aanpak." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: Story,
});

function Story() {
  const values = [
    { title: "Premium kwaliteit", image: fabric.url, alt: "Detail van de HYBR stof", text: "Onze toewijding aan premium kwaliteit begint bij de stof, de pasvorm en het draagcomfort. We combineren technische materialen met een verfijnde afwerking om kleding te maken die goed voelt tijdens het sporten en daarna nog steeds scherp uitziet. Voor ons is kwaliteit de voorwaarde voor creativiteit. Het een kan niet zonder het ander." },
    { title: "Grenzeloze creativiteit", image: studio.url, alt: "Een persoonlijk CREATEE ontwerp", text: "Vanuit die premium basis laten we de creativiteit pas echt de vrije loop. We geloven niet in de standaard grijze massa, dus ontwerpen we uitsluitend exclusieve designs die je nergens anders op de fairway tegenkomt. Bovendien bieden we een podium aan sporters die zelf hun visie willen uiten via onze Design Studio." },
    { title: "Persoonlijke aanpak", image: personal.url, alt: "CREATEE kleding op de golfbaan", text: "Die creativiteit krijgt pas echt betekenis door de persoonlijke klik die we met je hebben. We zijn namelijk geen anonieme fabriek, maar golfers die de sport begrijpen en er plezier in hebben. Om jouw ideeën echt tot leven te wekken, bieden we in onze Design Studio altijd een gratis online meeting aan. Op die manier kennen we echt samen wat je nodig hebt en maken we samen iets unieks." },
  ];
  return <ShopLayout page="story">
    <div className="about-atelier">
      <section data-section="story-intro" className="about-band about-opening">
        <div className="about-opening-grid">
          <AboutCollage image={studio.url} alt="Een persoonlijk CREATEE ontwerp" detail={fabric.url} detailAlt="Detail van de premium HYBR stof" />
          <div className="about-opening-copy">
            <p className="about-kicker text-primary">CREATEE · Het verhaal achter het merk</p>
            <h1 className="about-headline">Exclusieve<br /><em>designs.</em></h1>
            <h2 className="about-secondary-title text-primary">Echte identiteit.</h2>
            <p className="about-lead">Je techniek is uniek, je tactiek is uniek, dus waarom zou je kleding dat niet zijn? CREATEE combineert de luxe van een premium fit met het lef van unieke designs.</p>
            <p className="about-note">Kies uit onze eigen exclusieve collectie of ontwerp samen met ons een custom meesterwerk voor je volgende reis of bedrijfsuitje. Speciale illustraties onderscheiden ons in HYBR™ Polo.</p>
            <p className="about-signature">Tradities zijn er om te eren, niet om te dragen. Wij geloven dat sportkleding meer mag zijn dan standaard.</p>
          </div>
        </div>
      </section>
      <section data-section="story-mission" className="about-band bg-primary text-primary-foreground">
        <div className="about-mission-grid">
          <div><h2 className="about-section-title">Onze missie</h2><p className="about-lead">Onze missie is om de eentonigheid in sportkleding te doorbreken. Met exclusieve artistieke collecties én ruimte voor de creatieve ideeën van sporters zelf maken we kleding die verder gaat dan standaard.</p><blockquote className="about-mission-quote">“Je kleding mag net zo uniek zijn als je spel, zonder dat je hoeft in te leveren op de technische kwaliteit die de sport vereist.”</blockquote></div>
          <img src={personal.url} alt="CREATEE kleding op de golfbaan" loading="lazy" className="about-mission-image" />
        </div>
      </section>
      <section data-section="story-begin" className="about-band bg-shop-surface">
        <div className="about-history-grid">
          <img src={laptop.url} alt="CREATEE design op een laptop" loading="lazy" className="about-history-image" />
          <div className="about-history-copy"><p className="about-kicker text-primary">De oorsprong</p><h2 className="about-section-title">Hoe het begon</h2><div className="about-prose"><p className="about-lead">CREATEE begon met een simpele vraag: waarom ziet sportkleding er vaak uit alsof niemand er plezier in mag hebben?</p><p>Overal zagen we dezelfde veilige shirts, dezelfde brave kleuren en dezelfde designs die vooral niets verkeerd wilden doen. Prima voor wie graag opgaat in de massa. Minder prima voor sporters met karakter, humor en een goed verhaal.</p><p>Dus besloten we het anders te doen. Premium sportkleding, maar dan met designs die wél iets losmaken. Soms artistiek, soms scherp, soms met een knipoog die pas na de tweede hole landt. Designs zoals geen enkel anoniem concept om te willen winnen, leuk genoeg om er niet saai bij te lopen.</p><p>Zo ontstond <strong>CREATEE</strong>. Voor teams, vriendengroepen, bedrijven en sporters die denken: als we toch samen het veld, de baan of de club op gaan, dan liever in iets dat blijft hangen.</p></div></div>
        </div>
      </section>
      <section data-section="story-values" className="about-band bg-muted">
        <h2 className="about-section-title about-values-title">Onze kernwaarden</h2>
        <div className="about-values-grid">{values.map((v, i) => <article key={v.title} className={`about-value ${i === 1 ? "bg-primary text-primary-foreground" : "bg-shop-surface text-shop-ink"}`}><div className="about-value-photo"><img src={v.image} alt={v.alt} loading="lazy" /><span className="about-value-number" aria-hidden="true">0{i + 1}</span></div><div className="about-value-copy"><h3>{v.title}</h3><p>{v.text}</p></div></article>)}</div>
      </section>
      <section data-section="story-cta" className="about-band bg-shop-surface about-cta"><div><h2 className="about-section-title text-primary">Klaar om op te vallen?</h2><p className="about-lead">Ruil jouw voorspelbare kleding in voor een exclusief design of creëer samen met ons een uniek meesterwerk. Wij staan voor je klaar.</p></div><div className="flex flex-wrap gap-3"><Button asChild variant="outline"><Link to="/collections/$slug" params={{ slug: "golf" }}>Designs</Link></Button><Button asChild><Link to="/design-studio">Studio</Link></Button></div></section>
    </div>
  </ShopLayout>;
}
