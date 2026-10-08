import { createFileRoute } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
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
  const features = [1, 2, 3, 4].map((n) => ({ n, title: t("hybr-2", `f${n}_title`), text: t("hybr-2", `f${n}_text`) })).filter((f) => f.title.trim());
  return <ShopLayout page="story" cms="hybr"><div className="about-atelier">
    <section data-section="hybr-1" className="about-band about-opening">
      <div className="about-opening-grid">
        <AboutCollage image={main.url} alt={main.alt} detail={detail.url} detailAlt={detail.alt} imageStyle={main.style} detailStyle={detail.style} />
        <div className="about-opening-copy">
          <p className="about-kicker text-primary">{t("hybr-1", "kicker")}</p>
          <h1 className="about-headline">{t("hybr-1", "headline")}<br /><em>{t("hybr-1", "headline_em")}</em></h1>
          <h2 className="about-secondary-title text-primary">{t("hybr-1", "subtitle")}</h2>
          <p className="about-lead">{t("hybr-1", "lead")}</p>
          <div className="about-actions">{t("hybr-1", "btn1_label") && <Button asChild><a href={t("hybr-1", "btn1_url")}>{t("hybr-1", "btn1_label")}</a></Button>}{t("hybr-1", "btn2_label") && <Button asChild variant="ghost"><a href={t("hybr-1", "btn2_url")}>{t("hybr-1", "btn2_label")}</a></Button>}</div>
          {t("hybr-1", "signature") && <p className="about-signature">{t("hybr-1", "signature")}</p>}
        </div>
      </div>
    </section>
    <section data-section="hybr-2" className="bg-primary text-primary-foreground">
      <div className="about-band about-technology-heading"><p className="about-kicker">{t("hybr-2", "kicker")}</p><h2 className="about-section-title">{t("hybr-2", "title_1")}<br />{t("hybr-2", "title_2")}</h2></div>
      <div className="about-band bg-shop-surface text-shop-ink about-technology-grid">{tech.url && <img src={tech.url} alt={tech.alt} style={tech.style} loading="lazy" className="about-history-image" />}<dl className="about-features">{features.map((f, i) => <div key={f.n}><dt className="text-primary"><span className="about-feature-number" aria-hidden="true">0{i + 1}</span>{f.title}</dt><dd>{f.text}</dd></div>)}</dl></div>
    </section>
  </div></ShopLayout>;
}
