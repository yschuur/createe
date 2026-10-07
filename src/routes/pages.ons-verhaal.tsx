import { createFileRoute, Link } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
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
  return <ShopLayout>
    <div className="bg-primary py-8 md:py-12">
      <section className="editorial-section p-6 sm:p-10 md:p-14">
        <p className="mb-5 text-[10px] font-bold uppercase text-primary">Het verhaal achter het merk</p>
        <h1 className="editorial-title text-3xl sm:text-4xl md:text-5xl">Exclusieve designs.<br />Echte identiteit.</h1>
        <div className="editorial-copy mt-6 max-w-2xl"><p>Tradities zijn er om te eren, niet om te dragen. Wij geloven dat sportkleding meer mag zijn dan standaard. Je techniek is uniek, je tactiek is uniek, dus waarom zou je kleding dat niet zijn? CREATEE combineert de luxe van een premium fit met het lef van unieke designs.</p></div>
        <p className="mt-6 max-w-2xl border-l-2 border-border pl-4 text-xs italic leading-relaxed text-muted-foreground">Kies uit onze eigen exclusieve collectie of ontwerp samen met ons een custom meesterwerk voor je volgende reis of bedrijfsuitje. Speciale illustraties onderscheiden ons in HYBR™ Polo.</p>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-10 text-primary-foreground md:py-14"><h2 className="text-xl font-bold uppercase">Onze missie</h2><p className="mt-3 text-sm leading-relaxed">Onze missie is om de eentonigheid in sportkleding te doorbreken. Met exclusieve artistieke collecties én ruimte voor de creatieve ideeën van sporters zelf maken we kleding die verder gaat dan standaard.</p><p className="mt-5 border-l-2 border-primary-foreground/50 pl-4 text-sm italic leading-relaxed">“Je kleding mag net zo uniek zijn als je spel, zonder dat je hoeft in te leveren op de technische kwaliteit die de sport vereist.”</p></section>
      <section className="editorial-section grid gap-8 p-6 sm:p-10 md:grid-cols-2 md:p-14">
        <div className="editorial-copy"><h2 className="mb-5 text-2xl font-bold uppercase">Hoe het begon</h2><p className="font-semibold">CREATEE begon met een simpele vraag: waarom ziet sportkleding er vaak uit alsof niemand er plezier in mag hebben?</p><p>Overal zagen we dezelfde veilige shirts, dezelfde brave kleuren en dezelfde designs die vooral niets verkeerd wilden doen. Prima voor wie graag opgaat in de massa. Minder prima voor sporters met karakter, humor en een goed verhaal.</p><p>Dus besloten we het anders te doen. Premium sportkleding, maar dan met designs die wél iets losmaken. Soms artistiek, soms scherp, soms met een knipoog die pas na de tweede hole landt. Designs zoals geen enkel anoniem concept om te willen winnen, leuk genoeg om er niet saai bij te lopen.</p><p>Zo ontstond <strong>CREATEE</strong>. Voor teams, vriendengroepen, bedrijven en sporters die denken: als we toch samen het veld, de baan of de club op gaan, dan liever in iets dat blijft hangen.</p></div>
        <img src={laptop.url} alt="CREATEE design op een laptop" loading="lazy" className="h-full min-h-64 w-full object-cover" />
      </section>
      <section className="mx-auto max-w-4xl px-4 py-10 md:py-14">
        <h2 className="mb-8 text-center text-3xl font-extrabold uppercase text-primary-foreground md:text-4xl">Onze kernwaarden</h2>
        <div className="space-y-5">{values.map((v, i) => <article key={v.title} className="grid overflow-hidden bg-shop-surface text-shop-ink md:grid-cols-2"><img src={v.image} alt={v.alt} loading="lazy" className={`h-64 w-full object-cover md:h-full ${i === 1 ? "md:order-2" : ""}`} /><div className="p-7 md:p-9"><h3 className="mb-4 text-lg font-bold uppercase">{v.title}</h3><p className="text-sm leading-relaxed">{v.text}</p></div></article>)}</div>
      </section>
      <section className="editorial-section px-6 py-8 text-center"><h2 className="editorial-title text-2xl">Klaar om op te vallen?</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed">Ruil jouw voorspelbare kleding in voor een exclusief design of creëer samen met ons een uniek meesterwerk. Wij staan voor je klaar.</p><div className="mt-6 flex justify-center gap-3"><Button asChild variant="outline"><Link to="/collections/$slug" params={{ slug: "golf" }}>Designs</Link></Button><Button asChild><Link to="/design-studio">Studio</Link></Button></div></section>
    </div>
  </ShopLayout>;
}