// Per-product editable page texts, stored in products.metadata.page (no schema change).
export type PdpAccordion = { title: string; html: string; open: boolean };
export type ProductPageContent = {
  fitLabel: string;
  fitValue: string;
  modelLabel: string;
  modelValue: string;
  sizeChartLabel: string;
  sizeChartUrl: string;
  sizeChartImage: string;
  addToCartLabel: string;
  intro: string;
  featureShow: boolean;
  featureTitle: string;
  featureLinkLabel: string;
  featureLinkUrl: string;
  featureButtonBg: string;
  featureButtonColor: string;
  featureBadges: string[];
  accordions: PdpAccordion[];
};

const CARE = `<ul><li>Poloshirt uithangen na het wassen.</li><li>Niet uitwringen, laten opdrogen.</li><li>Niet geschikt voor in de droger.</li><li>Wassen binnenstebuiten op 30 graden of lager, 400 toeren.</li></ul><p><strong>OEKO-TEX gecertificeerd</strong><br>Wist je dat elk onderdeel van onze producten het Oeko-Tex 100 certificaat draagt? Of het nu gaat om de stof, de knopen of zelfs de stiksels: alles voldoet aan de strengste veiligheidseisen. Zo weet je zeker dat je textiel in handen hebt zonder schadelijke chemicaliën. Dat is wel zo prettig voor je gezondheid en een stuk fijner voor je huid.</p>`;

type P = { name: string; fit: string | null; fabric: string | null; product_type: string | null; description_html: string | null; metadata: unknown };

export function defaultPage(p: P): ProductPageContent {
  const isPolo = /polo|hybr/i.test(`${p.name} ${p.product_type ?? ""}`);
  return {
    fitLabel: "Fit:",
    fitValue: p.fit ?? "Modern fit",
    modelLabel: "Model:",
    modelValue: "1.82m en draagt maat M",
    sizeChartLabel: "Maattabel",
    sizeChartUrl: "",
    sizeChartImage: "",
    addToCartLabel: "Aan winkelwagen toevoegen",
    intro: p.description_html ?? "",
    featureShow: isPolo,
    featureTitle: "De HYBR™ polo",
    featureLinkLabel: "Meer informatie",
    featureLinkUrl: "/pages/de-hybr-polo",
    featureButtonBg: "",
    featureButtonColor: "",
    featureBadges: ["360° stretch", "Premium finish", "Smart-collar", "Kreukvrij & ademend"],
    accordions: [
      { title: "Productdetails", open: false, html: '<p><strong>Materiaal</strong></p><ul><li>95% Organisch Katoen</li><li>5% Dynamisch Elastaan</li></ul><p><strong>Specificaties</strong></p><ul><li>215g/m²</li><li>Glad afgewerkte sluiting</li><li>Dubbel voorgekrompen</li><li>Plat gebreide kraag met elastaan</li></ul>' },
      { title: "Verzending", open: false, html: "<p>Onze standaardproducten worden meestal binnen 1 tot 3 werkdagen verstuurd met PostNL.</p>" },
      { title: "Onderhoudsinstructies", open: false, html: CARE },
    ],
  };
}

export function getPage(p: P): ProductPageContent {
  const saved = ((p.metadata as Record<string, unknown> | null)?.["page"] ?? {}) as Partial<ProductPageContent>;
  return { ...defaultPage(p), ...saved };
}
