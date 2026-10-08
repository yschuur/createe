import { createFileRoute } from "@tanstack/react-router";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { PageText } from "@/components/shop/PageText";
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
  const begin = m("story-begin", "image");
  const values = [1, 2, 3].map((n) => ({ n, number: t("story-values", `v${n}_number`), title: t("story-values", `v${n}_title`), text: t("story-values", `v${n}_text`), image: m("story-values", `v${n}_image`), bg: color("story-values", `v${n}_bg`), fg: color("story-values", `v${n}_color`) }));
  return <ShopLayout page="story" cms="story">
    <div className="about-reference about-story">
      <section data-section="story-intro" className="about-band about-opening">
        <div className="about-opening-copy">
          <PageText className="about-kicker text-primary" value={t("story-intro", "kicker")} />
          <h1 className="about-headline text-primary"><PageText as="span" inline value={t("story-intro", "title_line1")} /><PageText as="span" inline value={t("story-intro", "title_line2")} /></h1>
          <div className="about-intro-prose">{t("story-intro", "signature") && <PageText className="contents" value={t("story-intro", "signature")} />}<PageText className="contents" value={t("story-intro", "lead")} /></div>
          {t("story-intro", "note") && <PageText className="about-note" value={t("story-intro", "note")} />}
        </div>
      </section>
      <section data-section="story-mission" className="about-band bg-primary text-primary-foreground">
        <div className="about-mission-grid">
          <div><PageText as="h2" className="about-section-title" value={t("story-mission", "title")} inline /><PageText as="div" className="about-lead" value={t("story-mission", "lead")} />{t("story-mission", "quote") && <PageText as="blockquote" className="about-mission-quote" value={t("story-mission", "quote")} />}</div>
        </div>
      </section>
      <section data-section="story-begin" className="about-band bg-shop-surface">
        <div className="about-history-grid">
          {begin.url && <div className="about-editorial-photo"><img src={begin.url} alt={begin.alt} style={begin.style} loading="lazy" className="about-history-image" /></div>}
          <div className="about-history-copy"><PageText as="h2" className="about-section-title" value={t("story-begin", "title")} inline /><div className="about-prose"><PageText as="div" className="about-lead" value={t("story-begin", "lead")} /><PageText className="contents" value={t("story-begin", "body")} /></div></div>
        </div>
      </section>
      <section data-section="story-values" className="about-band bg-primary text-primary-foreground">
        <PageText as="h2" className="about-section-title about-values-title" value={t("story-values", "title")} inline />
        <div className="about-values-grid">{values.map((v) => <article key={v.n} className={`about-value bg-shop-surface text-shop-ink`} style={v.bg || v.fg ? { ...(v.bg ? { backgroundColor: v.bg } : {}), ...(v.fg ? { color: v.fg } : {}) } : undefined}><div className="about-value-photo">{v.image.url && <img src={v.image.url} alt={v.image.alt} style={v.image.style} loading="lazy" />}</div><div className="about-value-copy"><PageText as="h3" value={v.title} inline /><PageText as="div" value={v.text} /></div></article>)}</div>
      </section>
      <section data-section="story-cta" className="about-band bg-shop-surface about-cta"><div><PageText as="h2" className="about-section-title text-primary" value={t("story-cta", "title")} inline /><PageText as="div" className="about-lead" value={t("story-cta", "text")} /></div><div className="about-actions">{t("story-cta", "btn1_label") && <Button asChild variant="outline"><a data-page-button="btn1" href={t("story-cta", "btn1_url")}>{t("story-cta", "btn1_label")}</a></Button>}{t("story-cta", "btn2_label") && <Button asChild><a data-page-button="btn2" href={t("story-cta", "btn2_url")}>{t("story-cta", "btn2_label")}</a></Button>}</div></section>
    </div>
  </ShopLayout>;
}
