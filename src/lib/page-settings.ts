import { queryOptions, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { FONTS } from "@/lib/section-styles";
import laptop from "@/assets/story-laptop.jpg.asset.json";
import fabric from "@/assets/story-fabric.jpg.asset.json";
import creativity from "@/assets/story-creativity.jpg.asset.json";
import personal from "@/assets/story-personal.jpg.asset.json";
import hybrGolf from "@/assets/hybr-golf.jpg.asset.json";
import hybrDetail from "@/assets/hybr-detail.jpg.asset.json";
import { focusPosition, type ImageFocus } from "@/lib/image-focus";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PageKey = "home" | "story" | "hybr" | "studio" | "collection" | "product" | "contact" | "global";
export type RoleId = "kicker" | "heading" | "subheading" | "body" | "label" | "link" | "price" | "button" | "faq-category" | "faq-question" | "faq-answer";
export type ResponsiveNumber = { mobile?: number | undefined; desktop?: number | undefined };
export type TypographyStyle = {
  font?: string | undefined; size?: ResponsiveNumber | undefined; weight?: number | undefined; lineHeight?: number | undefined;
  letterSpacing?: number | undefined; transform?: "default" | "uppercase" | "lowercase" | "capitalize" | undefined;
  align?: "left" | "center" | "right" | undefined; color?: string | undefined;
};
export type MediaValue = { url?: string | undefined; alt?: string | undefined; position?: Position | undefined; focus?: ImageFocus | undefined };
export type Position = "center" | "top" | "bottom" | "left" | "right";
export type ButtonStyle = {
  variant?: "filled" | "outline" | "ghost" | undefined; bg?: string | undefined; color?: string | undefined; border?: string | undefined;
  hoverBg?: string | undefined; hoverColor?: string | undefined; hoverBorder?: string | undefined; borderWidth?: number | undefined; borderStyle?: "solid" | "dashed" | "dotted" | "none" | undefined; font?: string | undefined;
  size?: number | undefined; weight?: number | undefined; radius?: number | undefined; px?: number | undefined; py?: number | undefined;
};
export type BackgroundStyle = {
  color?: string | undefined; image?: string | undefined; size?: "cover" | "contain" | undefined; position?: Position | undefined;
  overlay?: string | undefined; overlayOpacity?: number | undefined;
};
export type SectionConfig = {
  visible?: boolean | undefined; hideMobile?: boolean | undefined; hideDesktop?: boolean | undefined;
  content?: Record<string, string> | undefined;
  media?: Record<string, MediaValue> | undefined;
  typography?: Partial<Record<RoleId, TypographyStyle>> | undefined;
  background?: BackgroundStyle | undefined;
  button?: ButtonStyle | undefined;
  buttons?: Record<string, ButtonStyle> | undefined;
  spacing?: { top?: ResponsiveNumber | undefined; bottom?: ResponsiveNumber | undefined; x?: ResponsiveNumber | undefined } | undefined;
  extra?: Record<string, ResponsiveNumber> | undefined;
};
export type PageConfig = { sections: Record<string, SectionConfig> };

export type ContentFieldDef = {
  key: string; label: string; type: "text" | "textarea" | "rich" | "url" | "select" | "color";
  default: string; options?: { value: string; label: string }[];
};
export type MediaFieldDef = { key: string; label: string; kind: "image" | "video"; default: string; alt: string };
export type ExtraDef = { key: string; label: string; min: number; max: number; step?: number; unit: string; responsive?: boolean; default?: number };
export type SectionDef = {
  id: string; label: string;
  content?: ContentFieldDef[]; media?: MediaFieldDef[]; roles: RoleId[];
  background?: boolean; backgroundImage?: boolean; buttons?: boolean; spacing?: boolean; extras?: ExtraDef[];
  buttonTargets?: { id: string; label: string; selector: string }[];
  contentLink?: { to: "/admin/homepage" | "/admin/studio" | "/admin/menu" | "/admin/contact"; label: string };
};
export type PageDef = { key: PageKey; slug: string; label: string; storageKey: string; viewUrl: string; description: string; sections: SectionDef[] };

/* ------------------------------------------------------------------ */
/* Section registry with code defaults (current CREATEE content)       */
/* ------------------------------------------------------------------ */

const yesNo = [{ value: "yes", label: "Ja" }, { value: "no", label: "Nee" }];
const txt = (key: string, label: string, d: string): ContentFieldDef => ({ key, label, type: "text", default: d });
const area = (key: string, label: string, d: string): ContentFieldDef => ({ key, label, type: "textarea", default: d });
const url = (key: string, label: string, d: string): ContentFieldDef => ({ key, label, type: "url", default: d });
const img = (key: string, label: string, d: string, alt: string): MediaFieldDef => ({ key, label, kind: "image", default: d, alt });
const allText: RoleId[] = ["kicker", "heading", "subheading", "body", "link", "button"];

export const PAGE_DEFS: PageDef[] = [
  {
    key: "contact", slug: "contact", label: "Contact", storageKey: "page_contact", viewUrl: "/pages/contact",
    description: "Contactformulier en veelgestelde vragen.",
    sections: [
      { id: "contact-form", label: "Contactformulier", roles: ["body", "label", "button"], background: true, spacing: true, buttons: true,
        content: [
          { key: "intro", label: "Tekst boven formulier", type: "rich", default: "Wij streven ernaar om binnen 2 werkdagen te reageren." },
          { key: "description", label: "Formuliertekst", type: "rich", default: "Of je nu meer wilt weten over onze huidige designs of interesse hebt in een custom design: dat horen wij heel graag, we denken graag met je mee. Heb je vragen over de status van je order, vergeet dan niet je ordernummer door te geven." },
          txt("name_label", "Naam — label", "Naam"), txt("name_placeholder", "Naam — voorbeeld", "Je naam"),
          txt("email_label", "E-mail — label", "E-mailadres"), txt("email_placeholder", "E-mail — voorbeeld", "naam@voorbeeld.nl"),
          txt("phone_label", "Telefoon — label", "Telefoonnummer"), txt("phone_placeholder", "Telefoon — voorbeeld", "Bijv. 06 12345678"),
          txt("order_label", "Order — label", "Ordernummer"), txt("order_placeholder", "Order — voorbeeld", "#12345"),
          txt("message_label", "Bericht — label", "Jouw bericht"), txt("message_placeholder", "Bericht — voorbeeld", "Waarmee kunnen we je helpen?"),
          txt("submit_label", "Verzendknop", "Verstuur bericht"), txt("privacy", "Privacytekst", "Respect voor jouw privacy"),
          { key: "success", label: "Bevestiging", type: "rich", default: "Bedankt! Je bericht is ontvangen." },
        ], buttonTargets: [{ id: "submit", label: "Verstuur bericht", selector: '[data-page-button=submit]' }] },
      { id: "contact-faq", label: "Veelgestelde vragen", roles: ["heading", "body", "button", "faq-category", "faq-question", "faq-answer"], background: true, spacing: true, buttons: true,
        content: [{ key: "intro", label: "Tekst boven FAQ", type: "rich", default: "Klik op een onderwerp om de veelgestelde vragen te bekijken." }],
        contentLink: { to: "/admin/contact", label: "Categorieën, vragen en antwoorden beheren" },
        buttonTargets: [{ id: "toggle", label: "FAQ openen / sluiten", selector: '[data-page-button=faq-toggle]' }] },
    ],
  },
  {
    key: "home", slug: "homepage", label: "Homepage", storageKey: "page_home", viewUrl: "/",
    description: "Header met video's, beoordelingenbalk en productcarrousel.",
    sections: [
      { id: "home-hero", label: "Header met video's", roles: ["button"], buttons: true,
        contentLink: { to: "/admin/homepage", label: "Knopteksten, links, video's en foto's" },
        extras: [{ key: "height", label: "Hoogte (% van scherm)", min: 30, max: 100, unit: "vh", responsive: true }, { key: "overlay", label: "Donkere overlay (%)", min: 0, max: 100, unit: "%" }] },
      { id: "home-ratings", label: "Beoordelingenbalk", roles: ["body", "link"], background: true, spacing: true,
        content: [txt("google_label", "Google-tekst", "Google ★★★★★"), txt("trust_label", "Trustpilot-tekst", "Trustpilot ★★★★★"), url("trust_url", "Trustpilot-link", "https://nl.trustpilot.com/review/createe.nl")] },
      { id: "home-products", label: "Productcarrousel", roles: ["heading", "subheading", "body", "link"], background: true, spacing: true, buttons: true,
        contentLink: { to: "/admin/homepage", label: "Titel, linktekst en uitgelichte producten" },
        content: [url("collection_url", "Link onder carrousel", "/collections/golf")],
        extras: [{ key: "count", label: "Aantal producten", min: 2, max: 40, unit: "", default: 12 }] },
    ],
  },
  {
    key: "studio", slug: "design-studio", label: "Design Studio", storageKey: "page_studio", viewUrl: "/design-studio",
    description: "Uitstraling van de Design Studio. Prijzen, reviews en foto's blijven in Design Studio-beheer.",
    sections: [
      { id: "studio-intro", label: "Intro & stappen", roles: allText, background: true, spacing: true, buttons: true, contentLink: { to: "/admin/studio", label: "Prijzen en productfoto's" } },
      { id: "studio-scorecard", label: "Scorecard", roles: allText, background: true, spacing: true, contentLink: { to: "/admin/studio", label: "Reviews" } },
      { id: "studio-form", label: "Aanvraagformulier", roles: [...allText, "label"], background: true, spacing: true, buttons: true },
    ],
  },
  {
    key: "story", slug: "ons-verhaal", label: "Ons verhaal", storageKey: "page_story", viewUrl: "/pages/ons-verhaal",
    description: "Intro, missie, oorsprong, kernwaarden en afsluiter.",
    sections: [
      { id: "story-intro", label: "Intro", roles: ["kicker", "heading", "subheading", "body"], background: true, backgroundImage: true, spacing: true,
        content: [txt("kicker", "Kicker", "Het verhaal achter het merk"), txt("title_line1", "Titel regel 1", "Exclusieve designs."), txt("title_line2", "Titel regel 2", "Echte identiteit."),
          area("lead", "Introtekst", "Je techniek is uniek, je tactiek is uniek, dus waarom zou je kleding dat niet zijn? CREATEE combineert de luxe van een premium fit met het lef van unieke designs."),
          area("note", "Extra tekst", "Kies uit onze eigen exclusieve collectie of ontwerp samen met ons een custom meesterwerk voor je volgende reis of bedrijfsuitje. Speciaal hiervoor ontwikkelden we de HYBR™ Polo."),
          area("signature", "Slotzin", "Tradities zijn er om te eren, niet om te dragen. Wij geloven dat sportkleding meer mag zijn dan standaard.")],
        media: [img("main", "Hoofdafbeelding", creativity.url, "Een persoonlijk CREATEE ontwerp"), img("detail", "Detailafbeelding", fabric.url, "Detail van de premium HYBR stof")] },
      { id: "story-mission", label: "Onze missie", roles: ["heading", "body"], background: true, backgroundImage: true, spacing: true,
        content: [txt("title", "Titel", "Onze missie"),
          area("lead", "Tekst", "Onze missie is om de eentonigheid in sportkleding te doorbreken. Met exclusieve artistieke collecties én ruimte voor de creatieve ideeën van sporters zelf maken we kleding die verder gaat dan standaard."),
          area("quote", "Citaat", "“Je kleding mag net zo uniek zijn als je spel, zonder dat je hoeft in te leveren op de technische kwaliteit die de sport vereist.”")],
        media: [img("image", "Afbeelding", personal.url, "CREATEE kleding op de golfbaan")] },
      { id: "story-begin", label: "Hoe het begon", roles: ["kicker", "heading", "body"], background: true, spacing: true,
        content: [txt("kicker", "Kicker", "De oorsprong"), txt("title", "Titel", "Hoe het begon"),
          area("lead", "Introzin", "CREATEE begon met een simpele vraag: waarom ziet sportkleding er vaak uit alsof niemand er plezier in mag hebben?"),
          { key: "body", label: "Verhaal", type: "rich", default: "<p>Overal zagen we dezelfde veilige shirts, dezelfde brave kleuren en dezelfde designs die vooral niets verkeerd wilden doen. Prima voor wie graag opgaat in de massa. Minder prima voor sporters met karakter, humor en een goed verhaal.</p><p>Dus besloten we het anders te doen. Premium sportkleding, maar dan met designs die wél iets losmaken. Soms artistiek, soms scherp, soms met een knipoog die pas na de tweede hole landt. Precies zoals sport zelf: <strong>serieus genoeg om te willen winnen, leuk genoeg om er niet saai bij te lopen.</strong></p><p>Zo ontstond <strong>CREATEE</strong>. Voor teams, vriendengroepen, bedrijven en sporters die denken: als we toch samen het veld, de baan of de club op gaan, dan liever in iets dat blijft hangen.</p>" }],
        media: [img("image", "Afbeelding", laptop.url, "CREATEE design op een laptop")] },
      { id: "story-values", label: "Kernwaarden", roles: ["heading", "subheading", "body"], background: true, spacing: true,
        content: [txt("title", "Titel", "Onze kernwaarden"),
          ...valueFields(1, "Premium kwaliteit", "Onze toewijding aan premium kwaliteit begint bij de stof, de pasvorm en het draagcomfort. We combineren technische materialen met een verfijnde afwerking om kleding te maken die goed voelt tijdens het sporten en daarna nog steeds scherp uitziet. Voor ons is kwaliteit de voorwaarde voor creativiteit. Het een kan niet zonder het ander."),
          ...valueFields(2, "Grenzeloze creativiteit", "Vanuit die premium basis laten we de creativiteit pas echt de vrije loop. We geloven niet in de standaard grijze massa, dus ontwerpen we uitsluitend exclusieve designs die je nergens anders op de fairway tegenkomt. Bovendien bieden we een podium aan sporters die zelf hun visie willen uiten via onze Design Studio."),
          ...valueFields(3, "Persoonlijke aanpak", "Die creativiteit krijgt pas echt betekenis door de persoonlijke klik die we met je hebben. We zijn namelijk geen anonieme fabriek, maar golfers die de sport begrijpen en er plezier in hebben. Om jouw ideeën echt tot leven te wekken, bieden we in onze Design Studio altijd een gratis online meeting aan. Op die manier kennen we echt samen wat je nodig hebt en maken we samen iets unieks.")],
        media: [img("v1_image", "Kaart 1 — foto", fabric.url, "Detail van de HYBR stof"), img("v2_image", "Kaart 2 — foto", "", "Een persoonlijk CREATEE ontwerp"), img("v3_image", "Kaart 3 — foto", "", "CREATEE kleding op de golfbaan")] },
      { id: "story-cta", label: "Afsluiter", roles: ["heading", "body", "button"], background: true, spacing: true, buttons: true,
        content: [txt("title", "Titel", "Klaar om op te vallen?"),
          area("text", "Tekst", "Ruil jouw voorspelbare kleding in voor een exclusief design of creëer samen met ons een uniek meesterwerk. Wij staan voor je klaar."),
          txt("btn1_label", "Knop 1 — tekst", "Designs"), url("btn1_url", "Knop 1 — link", "/collections/golf"),
          txt("btn2_label", "Knop 2 — tekst", "Studio"), url("btn2_url", "Knop 2 — link", "/design-studio")] },
    ],
  },
  {
    key: "hybr", slug: "de-hybr-polo", label: "De HYBR™ Polo", storageKey: "page_hybr", viewUrl: "/pages/de-hybr-polo",
    description: "Opening en HYBR™-technologie.",
    sections: [
      { id: "hybr-1", label: "Eerste blok", roles: ["kicker", "heading", "subheading", "body", "button"], background: true, backgroundImage: true, spacing: true, buttons: true,
        content: [txt("kicker", "Kicker", "HYBR™"), txt("headline", "Hoofdtitel", "De HYBR™"), txt("headline_em", "Hoofdtitel — vervolg", "polo."),
          txt("subtitle", "Subtitel", "Ultieme veelzijdigheid."),
          area("lead", "Introtekst", "Ontdek de ultieme veelzijdigheid. De HYBR™ Polo is ontwikkeld voor de golfer die prestatie eist zonder in te leveren op een volmaakte look. Onze unieke hybride stof biedt volledige bewegingsvrijheid, maar keert daarna direct terug naar de perfecte pasvorm. Ervaar het comfort van een sportpolo met de uitstraling van premium kwaliteit."),
          txt("btn1_label", "Knop 1 — tekst", "Ontdek HYBR"), url("btn1_url", "Knop 1 — link", "/collections/polos"),
          txt("btn2_label", "Knop 2 — tekst", "Personaliseer nu"), url("btn2_url", "Knop 2 — link", "/design-studio"),
          area("signature", "Slotzin", "Het comfort van een sportpolo met de uitstraling van premium kwaliteit.")],
        media: [img("main", "Hoofdafbeelding", hybrGolf.url, "Golfer in de groene CREATEE HYBR polo"), img("detail", "Detailafbeelding", hybrDetail.url, "Detail van de kraag en het CREATEE borduursel")] },
      { id: "hybr-2", label: "Tweede blok (technologie)", roles: ["kicker", "heading", "label", "body"], background: true, spacing: true,
        content: [txt("kicker", "Kicker", "De details maken het verschil"), txt("title_1", "Titel regel 1", "De kracht van"), txt("title_2", "Titel regel 2", "HYBR™ technologie"),
          txt("f1_title", "Kenmerk 1 — titel", "360° stretch"), area("f1_text", "Kenmerk 1 — tekst", "Maximale flexibiliteit voor een krachtige swing, waarna de stof direct weer herstelt naar de perfecte fit. Volledige vrijheid, zonder vormverlies."),
          txt("f2_title", "Kenmerk 2 — titel", "Premium finish"), area("f2_text", "Kenmerk 2 — tekst", "Vergeet de glimmende, plastic look van standaard sportpolo’s. Ervaar een rijke, matte textuur met luxe micro-details voor een verfijnde uitstraling."),
          txt("f3_title", "Kenmerk 3 — titel", "Smart-collar"), area("f3_text", "Kenmerk 3 — tekst", "Een kraag die nooit inzakt. Of je nu afslaat of proost op de overwinning, je ziet er de hele dag haarscherp uit."),
          txt("f4_title", "Kenmerk 4 — titel", "Kreukvrij & ademend"), area("f4_text", "Kenmerk 4 — tekst", "Optimale ventilatie en kreukvrij. Zelfs na 18 holes zie je er fris uit.")],
        media: [img("image", "Afbeelding", hybrDetail.url, "Detail van de kraag en het CREATEE borduursel")] },
    ],
  },
  {
    key: "collection", slug: "collections", label: "Collectiepagina's", storageKey: "page_collection", viewUrl: "/collections/golf",
    description: "Geldt voor alle collectiepagina's. Namen en omschrijvingen staan bij Collecties.",
    sections: [
      { id: "collection-header", label: "Titel & filters", roles: ["heading", "body", "link"], background: true, spacing: true },
      { id: "collection-grid", label: "Productoverzicht", roles: ["subheading", "body", "price"], background: true, spacing: true,
        extras: [{ key: "colsMobile", label: "Kolommen mobiel", min: 1, max: 3, unit: "" }, { key: "colsDesktop", label: "Kolommen desktop", min: 2, max: 6, unit: "" }, { key: "gap", label: "Ruimte tussen producten", min: 0, max: 80, unit: "px" }] },
    ],
  },
  {
    key: "product", slug: "product", label: "Productpagina", storageKey: "page_product", viewUrl: "/collections/golf",
    description: "Uitstraling van alle productpagina's. Productteksten blijven bij het product zelf.",
    sections: [
      { id: "product-main", label: "Productpagina", roles: ["heading", "price", "body", "label", "button"], background: true, spacing: true, buttons: true,
        content: [{ key: "aspect", label: "Verhouding foto's", type: "select", default: "3/4", options: [{ value: "3/4", label: "Staand 3:4" }, { value: "4/5", label: "Staand 4:5" }, { value: "2/3", label: "Hoog 2:3" }, { value: "1/1", label: "Vierkant" }] }] },
    ],
  },
  {
    key: "global", slug: "global", label: "Algemene layout", storageKey: "page_global", viewUrl: "/",
    description: "Aankondigingsbalk, menu-balk, USP-balk, reviews en footer op alle pagina's.",
    sections: [
      { id: "site-buttons", label: "Alle knoppen", roles: [], buttons: true, buttonTargets: [
        { id: "filled", label: "Gevulde knoppen", selector: '[data-slot=button][data-variant=default]' },
        { id: "outline", label: "Omlijnde knoppen", selector: '[data-slot=button][data-variant=outline]' },
        { id: "ghost", label: "Tekst- en icoonknoppen", selector: '[data-slot=button][data-variant=ghost]' },
        { id: "cart", label: "Winkelmand — afrekenen", selector: '[data-page-button=checkout]' },
      ] },
      { id: "site-announcement", label: "Aankondigingsbalk", roles: ["body", "link"], background: true, contentLink: { to: "/admin/homepage", label: "Teksten en links" } },
      { id: "site-header", label: "Menu-balk", roles: ["link"], background: true, contentLink: { to: "/admin/menu", label: "Menu-onderdelen" },
        content: [{ key: "logo", label: "Logo", type: "select", default: "green", options: [{ value: "green", label: "Groen" }, { value: "white", label: "Wit" }] }, { key: "sticky", label: "Blijft bovenaan bij scrollen", type: "select", default: "yes", options: yesNo }],
        extras: [{ key: "height", label: "Hoogte", min: 48, max: 140, unit: "px" }] },
      { id: "site-usps", label: "USP-balk", roles: ["body"], background: true, spacing: true,
        content: [...usp(1, "Binnen 1-3 werkdagen verzonden"), ...usp(2, "Gratis verzending vanaf €75"), ...usp(3, "Eenvoudig retourneren & gratis ruilen")] },
      { id: "site-reviews", label: "Reviews", roles: ["heading", "body", "label"], background: true, spacing: true },
      { id: "site-footer", label: "Footer", roles: ["heading", "body", "link"], background: true, spacing: true,
        content: [{ key: "logo", label: "Logo", type: "select", default: "white", options: [{ value: "white", label: "Wit" }, { value: "green", label: "Groen" }] },
          area("about", "Tekst onder logo", "Tradities zijn er om te eren, niet om te dragen. Wij geloven dat sportkleding meer mag zijn dan standaard. Je techniek is uniek, je tactiek is uniek, dus waarom zou je kleding dat niet zijn? CREATEE combineert de luxe van een premium fit met het lef van uniek design."),
          txt("h_discover", "Kop kolom 1", "Ontdek"), txt("h_info", "Kop kolom 2", "Informatie"),
          txt("info1", "Informatie regel 1", "Binnen 1-3 werkdagen verzonden"), txt("info2", "Informatie regel 2", "Gratis verzending vanaf €75"),
          txt("info3_label", "Informatie link — tekst", "Reviews op Trustpilot"), url("info3_url", "Informatie link — adres", "https://nl.trustpilot.com/review/createe.nl"),
          txt("club_title", "Nieuwsbrief — kop", "The Clubhouse"),
          { key: "club_text", label: "Nieuwsbrief — tekst", type: "rich", default: "<p>Word lid van The Clubhouse en ontvang direct <strong>gratis bezorging</strong> op je volgende bestelling.</p>" },
          txt("copyright", "Copyright-naam", "CREATEE")] },
    ],
  },
];

const actionTargets: Record<string, { id: string; label: string; selector: string }[]> = {
  "home-hero": ["golf", "studio", "padel"].map((id) => ({ id, label: id === "studio" ? "Studio" : id === "golf" ? "Golf" : "Padel", selector: `[data-page-button=${id}]` })),
  "home-products": [{ id: "previous", label: "Vorige producten", selector: '[aria-label="Vorige producten"]' }, { id: "next", label: "Volgende producten", selector: '[aria-label="Volgende producten"]' }],
  "studio-intro": [{ id: "request", label: "Vraag je design aan", selector: '[href="#aanvraag"]' }],
  "studio-form": [{ id: "submit", label: "Verzend aanvraag", selector: '[type=submit]' }, { id: "gender", label: "Heren / Dames", selector: '.atelier-toggle button' }, { id: "product", label: "Productkeuzes", selector: '.atelier-sample' }, { id: "color", label: "Kleurkeuzes", selector: '.atelier-swatch' }],
  "product-main": [{ id: "add", label: "Aan winkelwagen toevoegen", selector: '[data-page-button=add]' }, { id: "size", label: "Maatkeuzes", selector: '[data-page-button=size]' }, { id: "chart", label: "Maattabel", selector: '[data-page-button=chart]' }],
  "site-header": [{ id: "menu", label: "Mobiel menu", selector: '[aria-label="Menu openen"]' }, { id: "account", label: "Mijn account", selector: '[aria-label="Mijn account"]' }, { id: "basket", label: "Winkelmand", selector: '[aria-label="Winkelmand"]' }],
  "site-reviews": [{ id: "previous", label: "Vorige review", selector: '[aria-label="Vorige reviews"]' }, { id: "next", label: "Volgende review", selector: '[aria-label="Volgende reviews"]' }, { id: "expand", label: "Lees meer / minder", selector: '[data-page-button=expand]' }],
};
for (const page of PAGE_DEFS) for (const section of page.sections) {
  const targets = actionTargets[section.id];
  if (targets) { section.buttonTargets = targets; section.buttons = true; }
}

// Editorial copy is formatted per field, not through a shared heading/body style.
for (const page of PAGE_DEFS.filter((p) => p.key === "story" || p.key === "hybr")) {
  for (const section of page.sections) {
    if (!section.content) continue;
    section.content = section.content.map((f) =>
      (f.type === "text" || f.type === "textarea") && !/^btn\d+_label$/.test(f.key) ? { ...f, type: "rich" } : f,
    );
  }
}
const technology = PAGE_DEFS.find((p) => p.key === "hybr")?.sections.find((s) => s.id === "hybr-2");
if (technology?.content) {
  for (let n = 1; n <= 4; n++) technology.content.push({ key: `f${n}_number`, label: `Kenmerk ${n} — nummer`, type: "rich", default: `0${n}` });
}

function valueFields(n: number, title: string, text: string): ContentFieldDef[] {
  return [txt(`v${n}_number`, `Kaart ${n} — nummer`, `0${n}`), txt(`v${n}_title`, `Kaart ${n} — titel`, title), area(`v${n}_text`, `Kaart ${n} — tekst`, text),
    { key: `v${n}_bg`, label: `Kaart ${n} — achtergrond`, type: "color", default: "" }, { key: `v${n}_color`, label: `Kaart ${n} — tekstkleur`, type: "color", default: "" }];
}
function usp(n: number, text: string): ContentFieldDef[] {
  return [txt(`u${n}_text`, `USP ${n} — tekst`, text), url(`u${n}_link`, `USP ${n} — link (optioneel)`, ""), { key: `u${n}_show`, label: `USP ${n} tonen`, type: "select", default: "yes", options: yesNo }];
}

// A stale page key or temporarily incomplete registry must never blank the shop.
export const pageDef = (key: PageKey): PageDef => PAGE_DEFS.find((p) => p.key === key) ?? {
  key, slug: key, label: key, storageKey: "", viewUrl: "/", description: "", sections: [],
};
export const pageDefBySlug = (slug: string) => PAGE_DEFS.find((p) => p.slug === slug);

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const RGB = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/i;
export const COLOR_TOKENS: Record<string, { label: string; css: string; swatch: string }> = {
  primary: { label: "CREATEE groen", css: "var(--primary)", swatch: "#275C38" },
  white: { label: "Wit", css: "#ffffff", swatch: "#ffffff" },
  dark: { label: "Zwart", css: "#1a1a1a", swatch: "#1a1a1a" },
  cream: { label: "Crème", css: "#f6f1e7", swatch: "#f6f1e7" },
  muted: { label: "Lichtgrijs", css: "#f5f5f5", swatch: "#f5f5f5" },
};
export function safeColor(v: unknown): string | undefined {
  if (typeof v !== "string" || !v) return undefined;
  if (COLOR_TOKENS[v]) return COLOR_TOKENS[v].css;
  const s = v.trim();
  return HEX.test(s) || RGB.test(s) ? s : undefined;
}
export const isValidColor = (v: string) => !v || !!safeColor(v);
/** Only https URLs or site-relative paths without characters that could break out of CSS/HTML. */
export function safeUrl(v: unknown): string | undefined {
  if (typeof v !== "string" || !v) return undefined;
  const s = v.trim();
  if (/["'()\\<>\s]/.test(s)) return undefined;
  return /^https:\/\//i.test(s) || /^\/(?!\/)/.test(s) ? s : undefined;
}
const POSITIONS: Position[] = ["center", "top", "bottom", "left", "right"];

const num = (lo: number, hi: number) => z.number().finite().min(lo).max(hi).optional().catch(undefined);
const rn = (lo: number, hi: number) => z.object({ mobile: num(lo, hi), desktop: num(lo, hi) }).partial().optional().catch(undefined);
const color = z.string().refine((v) => !v || !!safeColor(v)).optional().catch(undefined);
const typo = z.object({
  font: z.string().refine((f) => !!FONTS[f]).optional().catch(undefined), size: rn(8, 160), weight: num(100, 900), lineHeight: num(0.8, 3),
  letterSpacing: num(-0.1, 0.5), transform: z.enum(["default", "uppercase", "lowercase", "capitalize"]).optional().catch(undefined),
  align: z.enum(["left", "center", "right"]).optional().catch(undefined), color,
}).optional().catch(undefined);
const buttonSchema = z.object({ variant: z.enum(["filled", "outline", "ghost"]).optional().catch(undefined), bg: color, color, border: color, hoverBg: color, hoverColor: color, hoverBorder: color, borderWidth: num(0, 12), borderStyle: z.enum(["solid", "dashed", "dotted", "none"]).optional().catch(undefined), font: z.string().refine((f) => !!FONTS[f]).optional().catch(undefined), size: num(8, 40), weight: num(100, 900), radius: num(0, 999), px: num(0, 80), py: num(0, 40) });
const sectionSchema = z.object({
  visible: z.boolean().optional().catch(undefined), hideMobile: z.boolean().optional().catch(undefined), hideDesktop: z.boolean().optional().catch(undefined),
  content: z.record(z.string().max(20000)).optional().catch(undefined),
  media: z.record(z.object({ url: z.string().max(4000).optional().catch(undefined), alt: z.string().max(300).optional().catch(undefined), position: z.enum(POSITIONS as [Position, ...Position[]]).optional().catch(undefined), focus: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional().catch(undefined) })).optional().catch(undefined),
  typography: z.record(typo).optional().catch(undefined),
  background: z.object({ color, image: z.string().max(4000).optional().catch(undefined), size: z.enum(["cover", "contain"]).optional().catch(undefined), position: z.enum(POSITIONS as [Position, ...Position[]]).optional().catch(undefined), overlay: color, overlayOpacity: num(0, 100) }).optional().catch(undefined),
  button: buttonSchema.optional().catch(undefined),
  buttons: z.record(buttonSchema).optional().catch(undefined),
  spacing: z.object({ top: rn(0, 400), bottom: rn(0, 400), x: rn(0, 200) }).optional().catch(undefined),
  extra: z.record(rn(0, 400)).optional().catch(undefined),
});
export const pageConfigSchema = z.object({ sections: z.record(sectionSchema.catch({})).catch({}) }).catch({ sections: {} });
export function parsePageConfig(v: unknown): PageConfig { return pageConfigSchema.parse(v ?? { sections: {} }) as PageConfig; }

/* ------------------------------------------------------------------ */
/* Defaults + deep merge                                               */
/* ------------------------------------------------------------------ */

export function isPlainObject(v: unknown): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v); }
/** Recursive merge: override wins; undefined never erases defaults (an empty text is a deliberate override). */
export function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) return (override === undefined ? base : (override as T));
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(override)) {
    if (v === undefined) continue;
    out[k] = k in out ? deepMerge(out[k], v) : v;
  }
  return out as T;
}
export function pageDefaults(key: PageKey): PageConfig {
  const sections: Record<string, SectionConfig> = {};
  for (const s of pageDef(key).sections) {
    sections[s.id] = {
      visible: true,
      content: Object.fromEntries((s.content ?? []).map((f) => [f.key, f.default])),
      media: Object.fromEntries((s.media ?? []).map((m) => [m.key, { url: m.default, alt: m.alt, position: "center" as Position }])),
      extra: Object.fromEntries((s.extras ?? []).filter((e) => e.default !== undefined).map((e) => [e.key, { desktop: e.default }])),
    };
  }
  return { sections };
}

export const pageSettingsQuery = (key: PageKey) => queryOptions({
  queryKey: ["site-settings", "page", key],
  queryFn: async (): Promise<PageConfig> => {
    const definition = pageDef(key);
    if (!definition.storageKey) return { sections: {} };
    const { data } = await supabase.from("site_settings").select("value").eq("key", definition.storageKey).maybeSingle();
    return parsePageConfig(data?.value);
  },
  staleTime: 60_000,
});

export type PageView = {
  config: PageConfig;
  t: (section: string, key: string) => string;
  m: (section: string, key: string) => { url: string; alt: string; style: { objectPosition: string } | undefined };
  n: (section: string, key: string) => number | undefined;
  color: (section: string, key: string) => string | undefined;
};
export function makePageView(key: PageKey, overrides: PageConfig | undefined): PageView {
  const config = deepMerge(pageDefaults(key), overrides ?? { sections: {} });
  const sec = (id: string) => config.sections[id] ?? {};
  return {
    config,
    t: (s, k) => sec(s).content?.[k] ?? "",
    m: (s, k) => {
      const v = sec(s).media?.[k] ?? {};
      const pos = v.focus ? focusPosition(v.focus) : v.position && POSITIONS.includes(v.position) && v.position !== "center" ? v.position : undefined;
      return { url: safeUrl(v.url) ?? "", alt: v.alt ?? "", style: pos ? { objectPosition: pos } : undefined };
    },
    n: (s, k) => sec(s).extra?.[k]?.desktop ?? sec(s).extra?.[k]?.mobile,
    color: (s, k) => safeColor(sec(s).content?.[k]),
  };
}
/** Storefront hook: one cached request per page, code defaults merged with saved overrides. */
export function usePageSettings(key: PageKey): PageView {
  const { data } = useQuery(pageSettingsQuery(key));
  return makePageView(key, data);
}

/* ------------------------------------------------------------------ */
/* Whitelisted CSS builder                                             */
/* ------------------------------------------------------------------ */

const ROLE_SELECTORS: [RoleId, string][] = [
  ["body", "p,li,dd,blockquote,figcaption"],
  ["link", "a:not([data-slot=button])"],
  ["label", "label,dt,[data-role=label]"],
  ["heading", "h1,h2,.about-headline,.about-section-title,.pdp-title,[data-role=heading]"],
  ["subheading", "h3,.about-secondary-title,[data-role=subheading]"],
  ["kicker", ".about-kicker,[data-role=kicker]"],
  ["price", "[data-role=price]"],
  ["button", "[data-slot=button]"],
  ["faq-category", '[data-role="faq-category"],[data-role="faq-category"] *'],
  ["faq-question", '[data-role="faq-question"],[data-role="faq-question"] *'],
  ["faq-answer", '[data-role="faq-answer"],[data-role="faq-answer"] *'],
];
const MD = "@media (min-width: 768px)";
const clampN = (v: unknown, lo: number, hi: number) => (typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined);

function responsive(sel: string, prop: string, r: ResponsiveNumber | undefined, lo: number, hi: number, unit: string, out: string[]) {
  const d = clampN(r?.desktop, lo, hi), m = clampN(r?.mobile, lo, hi);
  const base = m ?? d;
  if (base !== undefined) out.push(`${sel}{${prop}:${base}${unit} !important}`);
  if (d !== undefined && m !== undefined && d !== m) out.push(`${MD}{${sel}{${prop}:${d}${unit} !important}}`);
}
function hexToRgba(c: string, opacity: number) {
  const hex = c.startsWith("#") ? c : "#1a1a1a";
  const h = hex.length === 4 ? hex.slice(1).split("").map((x) => x + x).join("") : hex.slice(1, 7);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${(opacity / 100).toFixed(2)})`;
}

export function buildPageCss(key: PageKey, overrides: PageConfig | undefined): string {
  if (!overrides) return "";
  const def = pageDef(key);
  const out: string[] = [];
  for (const s of def.sections) {
    const c = overrides.sections?.[s.id];
    if (!c) continue;
    const root = s.id === "site-buttons" ? ".storefront" : `.storefront [data-section="${s.id}"]`;
    if (c.visible === false) out.push(`${root}{display:none !important}`);
    if (c.hideMobile) out.push(`@media (max-width: 767px){${root}{display:none !important}}`);
    if (c.hideDesktop) out.push(`${MD}{${root}{display:none !important}}`);
    // Background
    const bg = c.background;
    if (bg) {
      const col = safeColor(bg.color);
      if (col) out.push(`${root}{background-color:${col} !important}`);
      const image = s.backgroundImage ? safeUrl(bg.image) : undefined;
      if (image) {
        const ov = safeColor(bg.overlay);
        const op = clampN(bg.overlayOpacity, 0, 100) ?? 0;
        const layer = ov && op > 0 ? `linear-gradient(${ov.startsWith("#") ? hexToRgba(ov, op) : ov},${ov.startsWith("#") ? hexToRgba(ov, op) : ov}),` : "";
        const pos = bg.position && POSITIONS.includes(bg.position) ? bg.position : "center";
        out.push(`${root}{background-image:${layer}url("${image}") !important;background-size:${bg.size === "contain" ? "contain" : "cover"} !important;background-position:${pos} !important;background-repeat:no-repeat !important}`);
      }
    }
    // Spacing
    if (c.spacing) {
      responsive(root, "padding-top", c.spacing.top, 0, 400, "px", out);
      responsive(root, "padding-bottom", c.spacing.bottom, 0, 400, "px", out);
      if (c.spacing.x) { responsive(root, "padding-left", c.spacing.x, 0, 200, "px", out); responsive(root, "padding-right", c.spacing.x, 0, 200, "px", out); }
    }
    // Typography per role
    for (const [role, selector] of ROLE_SELECTORS) {
      if ((key === "story" || key === "hybr") && role !== "button") continue;
      const st = c.typography?.[role];
      if (!st || !s.roles.includes(role)) continue;
      const sel = selector.split(",").map((x) => `${root} :is(${x})${role.startsWith("faq-") ? "" : ":not(.cms-rich *)"}`).join(",");
      const decl: string[] = [];
      if (st.font && FONTS[st.font]) decl.push(`font-family:${FONTS[st.font]}`);
      const w = clampN(st.weight, 100, 900); if (w) decl.push(`font-weight:${Math.round(w / 100) * 100}`);
      const lh = clampN(st.lineHeight, 0.8, 3); if (lh) decl.push(`line-height:${lh}`);
      const ls = clampN(st.letterSpacing, -0.1, 0.5); if (ls !== undefined) decl.push(`letter-spacing:${ls}em`);
      if (st.transform && st.transform !== "default") decl.push(`text-transform:${st.transform}`);
      if (st.align) decl.push(`text-align:${st.align}`);
      const col = safeColor(st.color); if (col) decl.push(`color:${col}`);
      if (decl.length) out.push(`${sel}{${decl.map((d) => d + " !important").join(";")}}`);
      responsive(sel, "font-size", st.size, 8, 160, "px", out);
    }
    // Buttons
    const buttonEntries: [string, ButtonStyle | undefined][] = [[`${root} :is(button,[data-slot=button])`, c.button]];
    for (const [id, style] of Object.entries(c.buttons ?? {})) {
      const target = s.buttonTargets?.find((t) => t.id === id);
      if (target) buttonEntries.push([`${root} ${target.selector}`, style]);
      else if (/^btn\d+$/.test(id) && s.content?.some((f) => f.key === `${id}_label`)) buttonEntries.push([`${root} [data-page-button="${id}"]`, style]);
    }
    for (const [sel, b] of buttonEntries) {
      if (!b || !s.buttons) continue;
      const decl: string[] = [];
      if (b.variant === "outline") decl.push("background:transparent", "border:1px solid currentColor", "box-shadow:none");
      if (b.variant === "ghost") decl.push("background:transparent", "border-color:transparent", "box-shadow:none");
      if (b.variant === "filled") decl.push("background:var(--primary)", "color:var(--primary-foreground)", "border-color:transparent");
      const bgc = safeColor(b.bg); if (bgc) decl.push(`background:${bgc}`);
      const fc = safeColor(b.color); if (fc) decl.push(`color:${fc}`);
      const bc = safeColor(b.border); if (bc) decl.push(`border:1px solid ${bc}`);
      if (b.font && FONTS[b.font]) decl.push(`font-family:${FONTS[b.font]}`);
      const bw = clampN(b.borderWidth, 0, 12); if (bw !== undefined) decl.push(`border-width:${bw}px`, "border-style:solid");
      if (b.borderStyle && ["solid", "dashed", "dotted", "none"].includes(b.borderStyle)) decl.push(`border-style:${b.borderStyle}`);
      const fs = clampN(b.size, 8, 40); if (fs) decl.push(`font-size:${fs}px`);
      const fw = clampN(b.weight, 100, 900); if (fw) decl.push(`font-weight:${Math.round(fw / 100) * 100}`);
      const r = clampN(b.radius, 0, 999); if (r !== undefined) decl.push(`border-radius:${r}px`);
      const px = clampN(b.px, 0, 80); if (px !== undefined) decl.push(`padding-left:${px}px`, `padding-right:${px}px`);
      const py = clampN(b.py, 0, 40); if (py !== undefined) decl.push(`padding-top:${py}px`, `padding-bottom:${py}px`, "height:auto");
      if (decl.length) out.push(`${sel}{${decl.map((d) => d + " !important").join(";")}}`);
      const hover = [["background", b.hoverBg], ["color", b.hoverColor], ["border-color", b.hoverBorder]].flatMap(([prop, value]) => { const col = safeColor(value); return col ? [`${prop}:${col} !important`] : []; });
      if (hover.length) out.push(`${sel}:is(:hover,:focus-visible){${hover.join(";")}}`);
    }
    // Section-specific whitelisted extras
    const ex = c.extra ?? {};
    if (s.id === "home-hero") {
      if (ex["height"]) { out.push(`${root}{min-height:0 !important;max-height:none !important}`); responsive(root, "height", ex["height"], 30, 100, "vh", out); }
      const o = clampN(ex["overlay"]?.desktop ?? ex["overlay"]?.mobile, 0, 100);
      if (o !== undefined) out.push(`${root} [data-role=overlay]{opacity:${o / 100} !important;background:linear-gradient(to top,var(--primary),transparent) !important}`);
    }
    if (s.id === "collection-grid") {
      const g = `${root} [data-role=grid]`;
      const cm = clampN(ex["colsMobile"]?.desktop ?? ex["colsMobile"]?.mobile, 1, 3); if (cm) out.push(`${g}{grid-template-columns:repeat(${Math.round(cm)},minmax(0,1fr)) !important}`);
      const cd = clampN(ex["colsDesktop"]?.desktop ?? ex["colsDesktop"]?.mobile, 2, 6); if (cd) out.push(`${MD}{${g}{grid-template-columns:repeat(${Math.round(cd)},minmax(0,1fr)) !important}}`);
      const gp = clampN(ex["gap"]?.desktop ?? ex["gap"]?.mobile, 0, 80); if (gp !== undefined) out.push(`${g}{gap:${gp}px !important}`);
    }
    if (s.id === "site-header") {
      if (c.content?.["sticky"] === "no") out.push(`${root}{position:relative !important}`);
      const h = clampN(ex["height"]?.desktop ?? ex["height"]?.mobile, 48, 140); if (h) out.push(`${root} > div{height:${h}px !important}`);
    }
    if (s.id === "product-main") {
      const a = c.content?.["aspect"];
      if (a && ["3/4", "4/5", "2/3", "1/1"].includes(a)) out.push(`${root} [data-role=pdp-image]{aspect-ratio:${a.replace("/", " / ")} !important}`);
    }
  }
  return out.join("\n");
}
