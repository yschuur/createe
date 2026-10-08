import { createFileRoute } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { PageText } from "@/components/shop/PageText";
import { AboutCollage } from "@/components/shop/AboutCollage";
import { pageSettingsQuery, usePageSettings } from "@/lib/page-settings";

export const Route = createFileRoute("/pages/de-hybr-polo")({
  head: () => ({ meta: [
    { title: "De HYBR™ polo — CREATEE" },
    { name: "description", content: "De HYBR™ polo: 360° stretch, premium finish, smart-collar en kreukvrij, ademend draagcomfort." },
    { property: "og:title", content: "De HYBR™ polo — CREATEE" },
    { property: "og:description", content: "Ontdek de ultieme veelzijdigheid van de CREATEE HYBR™ polo." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(pageSettingsQuery("hybr")), context.queryClient.ensureQueryData(pageSettingsQuery("global"))]),
  component: Hybr,
});

function Hybr() {
  const { t, m } = usePageSettings("hybr");
  const main = m("hybr-1", "main"), detail = m("hybr-1", "detail"), tech = m("hybr-2", "image");
  const features = [1, 2, 3, 4].map((n) => ({ n, number: t("hybr-2", `f${n}_number`), title: t("hybr-2", `f${n}_title`), text: t("hybr-2", `f${n}_text`) })).filter((f) => f.title.trim());
  return <ShopLayout page="story" cms="hybr"><div className="about-atelier">
    <section data-section="hybr-1" className="about-band about-opening">
      <div className="about-opening-grid">
        <AboutCollage image={main.url} alt={main.alt} detail={detail.url} detailAlt={detail.alt} imageStyle={main.style} detailStyle={detail.style} />
        <div className="about-opening-copy">
          <PageText as="div" className="about-kicker text-primary" value={t("hybr-1", "kicker")} />
          <h1 className="about-headline"><PageText as="span" inline value={t("hybr-1", "headline")} /><em><PageText as="span" inline value={t("hybr-1", "headline_em")} /></em></h1>
          <PageText as="h2" className="about-secondary-title text-primary" value={t("hybr-1", "subtitle")} inline />
          <PageText as="div" className="about-lead" value={t("hybr-1", "lead")} />
          <div className="about-actions">{t("hybr-1", "btn1_label") && <Button asChild><a data-page-button="btn1" href={t("hybr-1", "btn1_url")}>{t("hybr-1", "btn1_label")}</a></Button>}{t("hybr-1", "btn2_label") && <Button asChild variant="ghost"><a data-page-button="btn2" href={t("hybr-1", "btn2_url")}>{t("hybr-1", "btn2_label")}</a></Button>}</div>
          {t("hybr-1", "signature") && <PageText as="div" className="about-signature" value={t("hybr-1", "signature")} />}
        </div>
      </div>
    </section>
    <section data-section="hybr-2" className="bg-primary text-primary-foreground">
      <div className="about-band about-technology-heading"><PageText as="div" className="about-kicker" value={t("hybr-2", "kicker")} /><h2 className="about-section-title"><PageText as="span" inline value={t("hybr-2", "title_1")} /><PageText as="span" inline value={t("hybr-2", "title_2")} /></h2></div>
      <div className="about-band bg-shop-surface text-shop-ink about-technology-grid">{tech.url && <img src={tech.url} alt={tech.alt} style={tech.style} loading="lazy" className="about-history-image" />}<dl className="about-features">{features.map((f) => <div key={f.n}><dt className="text-primary"><PageText as="span" inline className="about-feature-number" value={f.number} /><PageText as="span" inline value={f.title} /></dt><PageText as="dd" value={f.text} /></div>)}</dl></div>
    </section>
  </div></ShopLayout>;
}
