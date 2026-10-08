import { createFileRoute } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { AboutCollage } from "@/components/shop/AboutCollage";
import { pageSettingsQuery, usePageSettings } from "@/lib/page-settings";
import { sanitizeDescription } from "@/lib/shop";

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
            <p className="about-kicker text-primary">{t("story-intro", "kicker")}</p>
            <h1 className="about-headline">{t("story-intro", "headline")}<br /><em>{t("story-intro", "headline_em")}</em></h1>
            <h2 className="about-secondary-title text-primary">{t("story-intro", "subtitle")}</h2>
            <p className="about-lead">{t("story-intro", "lead")}</p>
            {t("story-intro", "note") && <p className="about-note">{t("story-intro", "note")}</p>}
            {t("story-intro", "signature") && <p className="about-signature">{t("story-intro", "signature")}</p>}
          </div>
        </div>
      </section>
      <section data-section="story-mission" className="about-band bg-primary text-primary-foreground">
        <div className="about-mission-grid">
          <div><h2 className="about-section-title">{t("story-mission", "title")}</h2><p className="about-lead">{t("story-mission", "lead")}</p>{t("story-mission", "quote") && <blockquote className="about-mission-quote">{t("story-mission", "quote")}</blockquote>}</div>
          {mission.url && <img src={mission.url} alt={mission.alt} style={mission.style} loading="lazy" className="about-mission-image" />}
        </div>
      </section>
      <section data-section="story-begin" className="about-band bg-shop-surface">
        <div className="about-history-grid">
          {begin.url && <img src={begin.url} alt={begin.alt} style={begin.style} loading="lazy" className="about-history-image" />}
          <div className="about-history-copy"><p className="about-kicker text-primary">{t("story-begin", "kicker")}</p><h2 className="about-section-title">{t("story-begin", "title")}</h2><div className="about-prose"><p className="about-lead">{t("story-begin", "lead")}</p><div className="contents" dangerouslySetInnerHTML={{ __html: sanitizeDescription(t("story-begin", "body")) }} /></div></div>
        </div>
      </section>
      <section data-section="story-values" className="about-band bg-muted">
        <h2 className="about-section-title about-values-title">{t("story-values", "title")}</h2>
        <div className="about-values-grid">{values.map((v) => <article key={v.n} className={`about-value ${v.n === 2 ? "bg-primary text-primary-foreground" : "bg-shop-surface text-shop-ink"}`} style={v.bg || v.fg ? { ...(v.bg ? { backgroundColor: v.bg } : {}), ...(v.fg ? { color: v.fg } : {}) } : undefined}><div className="about-value-photo">{v.image.url && <img src={v.image.url} alt={v.image.alt} style={v.image.style} loading="lazy" />}<span className="about-value-number" aria-hidden="true">{v.number}</span></div><div className="about-value-copy"><h3>{v.title}</h3><p>{v.text}</p></div></article>)}</div>
      </section>
      <section data-section="story-cta" className="about-band bg-shop-surface about-cta"><div><h2 className="about-section-title text-primary">{t("story-cta", "title")}</h2><p className="about-lead">{t("story-cta", "text")}</p></div><div className="flex flex-wrap gap-3">{t("story-cta", "btn1_label") && <Button asChild variant="outline"><a href={t("story-cta", "btn1_url")}>{t("story-cta", "btn1_label")}</a></Button>}{t("story-cta", "btn2_label") && <Button asChild><a href={t("story-cta", "btn2_url")}>{t("story-cta", "btn2_label")}</a></Button>}</div></section>
    </div>
  </ShopLayout>;
}
