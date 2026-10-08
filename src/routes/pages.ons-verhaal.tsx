import { createFileRoute } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { PageText } from "@/components/shop/PageText";
import { AboutCollage } from "@/components/shop/AboutCollage";
import { pageSettingsQuery, usePageSettings } from "@/lib/page-settings";

export const Route = createFileRoute("/pages/ons-verhaal")({
  head: () => ({ meta: [
    { title: "Ons verhaal — CREATEE" },
    { name: "description", content: "Exclusieve designs. Echte identiteit. Ontdek het verhaal, de missie en de kernwaarden van CREATEE." },
    { property: "og:title", content: "Ons verhaal — CREATEE" },
    { property: "og:description", content: "Premium kwaliteit, grenzeloze creativiteit en een persoonlijke aanpak." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(pageSettingsQuery("story")), context.queryClient.ensureQueryData(pageSettingsQuery("global"))]),
  component: Story,
});

function Story() {
  const { t, m, color } = usePageSettings("story");
  const intro = { main: m("story-intro", "main"), detail: m("story-intro", "detail") };
  const mission = m("story-mission", "image");
  const begin = m("story-begin", "image");
  const values = [1, 2, 3].map((n) => ({ n, number: t("story-values", `v${n}_number`), title: t("story-values", `v${n}_title`), text: t("story-values", `v${n}_text`), image: m("story-values", `v${n}_image`), bg: color("story-values", `v${n}_bg`), fg: color("story-values", `v${n}_color`) }));
  return <ShopLayout page="story" cms="story">
    <div className="about-atelier">
      <section data-section="story-intro" className="about-band about-opening">
        <div className="about-opening-grid">
          <AboutCollage image={intro.main.url} alt={intro.main.alt} detail={intro.detail.url} detailAlt={intro.detail.alt} imageStyle={intro.main.style} detailStyle={intro.detail.style} />
          <div className="about-opening-copy">
            <PageText as="div" className="about-kicker text-primary" value={t("story-intro", "kicker")} />
            <h1 className="about-headline"><PageText as="span" inline value={t("story-intro", "headline")} /><em><PageText as="span" inline value={t("story-intro", "headline_em")} /></em></h1>
            <PageText as="h2" className="about-secondary-title text-primary" value={t("story-intro", "subtitle")} inline />
            <PageText as="div" className="about-lead" value={t("story-intro", "lead")} />
            {t("story-intro", "note") && <PageText as="div" className="about-note" value={t("story-intro", "note")} />}
            {t("story-intro", "signature") && <PageText as="div" className="about-signature" value={t("story-intro", "signature")} />}
          </div>
        </div>
      </section>
      <section data-section="story-mission" className="about-band bg-primary text-primary-foreground">
        <div className="about-mission-grid">
          <div><PageText as="h2" className="about-section-title" value={t("story-mission", "title")} inline /><PageText as="div" className="about-lead" value={t("story-mission", "lead")} />{t("story-mission", "quote") && <PageText as="blockquote" className="about-mission-quote" value={t("story-mission", "quote")} />}</div>
          {mission.url && <img src={mission.url} alt={mission.alt} style={mission.style} loading="lazy" className="about-mission-image" />}
        </div>
      </section>
      <section data-section="story-begin" className="about-band bg-shop-surface">
        <div className="about-history-grid">
          {begin.url && <img src={begin.url} alt={begin.alt} style={begin.style} loading="lazy" className="about-history-image" />}
          <div className="about-history-copy"><PageText as="div" className="about-kicker text-primary" value={t("story-begin", "kicker")} /><PageText as="h2" className="about-section-title" value={t("story-begin", "title")} inline /><div className="about-prose"><PageText as="div" className="about-lead" value={t("story-begin", "lead")} /><PageText className="contents" value={t("story-begin", "body")} /></div></div>
        </div>
      </section>
      <section data-section="story-values" className="about-band bg-muted">
        <PageText as="h2" className="about-section-title about-values-title" value={t("story-values", "title")} inline />
        <div className="about-values-grid">{values.map((v) => <article key={v.n} className={`about-value ${v.n === 2 ? "bg-primary text-primary-foreground" : "bg-shop-surface text-shop-ink"}`} style={v.bg || v.fg ? { ...(v.bg ? { backgroundColor: v.bg } : {}), ...(v.fg ? { color: v.fg } : {}) } : undefined}><div className="about-value-photo">{v.image.url && <img src={v.image.url} alt={v.image.alt} style={v.image.style} loading="lazy" />}<PageText as="span" inline className="about-value-number" value={v.number} /></div><div className="about-value-copy"><PageText as="h3" value={v.title} inline /><PageText as="div" value={v.text} /></div></article>)}</div>
      </section>
      <section data-section="story-cta" className="about-band bg-shop-surface about-cta"><div><PageText as="h2" className="about-section-title text-primary" value={t("story-cta", "title")} inline /><PageText as="div" className="about-lead" value={t("story-cta", "text")} /></div><div className="flex flex-wrap gap-3">{t("story-cta", "btn1_label") && <Button asChild variant="outline"><a data-page-button="btn1" href={t("story-cta", "btn1_url")}>{t("story-cta", "btn1_label")}</a></Button>}{t("story-cta", "btn2_label") && <Button asChild><a data-page-button="btn2" href={t("story-cta", "btn2_url")}>{t("story-cta", "btn2_label")}</a></Button>}</div></section>
    </div>
  </ShopLayout>;
}
