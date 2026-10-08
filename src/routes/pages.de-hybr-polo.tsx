import { createFileRoute } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { PageText } from "@/components/shop/PageText";
import { pageSettingsQuery, usePageSettings } from "@/lib/page-settings";

export const Route = createFileRoute("/pages/de-hybr-polo")({
  head: () => ({ meta: [
    { title: "De HYBR™ polo | CREATEE" },
    { name: "description", content: "De HYBR™ polo: 360° stretch, premium finish, smart-collar en kreukvrij, ademend draagcomfort." },
    { property: "og:title", content: "De HYBR™ polo | CREATEE" },
    { property: "og:description", content: "Ontdek de ultieme veelzijdigheid van de CREATEE HYBR™ polo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(pageSettingsQuery("hybr")), context.queryClient.ensureQueryData(pageSettingsQuery("global"))]),
  component: Hybr,
});

function Hybr() {
  const { t, m } = usePageSettings("hybr");
  const main = m("hybr-1", "main"), tech = m("hybr-2", "image");
  const features = [1, 2, 3, 4].map((n) => ({ n, number: t("hybr-2", `f${n}_number`), title: t("hybr-2", `f${n}_title`), text: t("hybr-2", `f${n}_text`) })).filter((f) => f.title.trim());
  return <ShopLayout page="story" cms="hybr"><div className="about-reference about-hybr">
    <section data-section="hybr-1" className="about-band about-opening">
      <div className="about-opening-grid">
        
        <div className="about-opening-copy">
          <PageText as="div" className="about-kicker text-primary" value={t("hybr-1", "kicker")} />
          <h1 className="about-headline text-primary"><PageText as="span" inline value={t("hybr-1", "headline")} /><PageText as="span" inline value={t("hybr-1", "headline_em")} /></h1>
          <PageText as="div" className="about-lead" value={t("hybr-1", "lead")} />
          <div className="about-actions">{t("hybr-1", "btn1_label") && <Button asChild><a data-page-button="btn1" href={t("hybr-1", "btn1_url")}>{t("hybr-1", "btn1_label")}</a></Button>}{t("hybr-1", "btn2_label") && <Button asChild variant="outline"><a data-page-button="btn2" href={t("hybr-1", "btn2_url")}>{t("hybr-1", "btn2_label")}</a></Button>}</div>
        </div>
        {main.url && <div className="about-editorial-photo"><img className="about-hybr-image" src={main.url} alt={main.alt} style={main.style} fetchPriority="high" /></div>}
      </div>
    </section>
    <section data-section="hybr-2" className="bg-shop-surface text-shop-ink about-technology-grid">
      {tech.url && <div className="about-editorial-photo"><img src={tech.url} alt={tech.alt} style={tech.style} loading="lazy" className="about-hybr-image" /></div>}
      <div className="about-technology-copy"><h2 className="about-section-title text-primary"><PageText as="span" inline value={t("hybr-2", "title_1")} /><PageText as="span" inline value={t("hybr-2", "title_2")} /></h2>
      <dl className="about-features">{features.map((f) => <div key={f.n}><dt className="text-primary"><PageText as="span" inline value={f.title} /></dt><PageText as="dd" value={f.text} /></div>)}</dl></div>
    </section>
  </div></ShopLayout>;
}
