import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export const faqSchema = z.object({ categories: z.array(z.object({
  id: z.string().min(1).max(100), title: z.string().min(1).max(2000),
  icon: z.enum(["general", "orders", "shipping", "returns", "studio"]),
  items: z.array(z.object({ id: z.string().min(1).max(100), question: z.string().min(1).max(5000), answer: z.string().min(1).max(20000) })).max(100),
})).max(50) });
export type FaqConfig = z.infer<typeof faqSchema>;
export type FaqCategory = FaqConfig["categories"][number];

export const defaultFaq: FaqConfig = {
  "categories": [
    {
      "id": "1",
      "title": "Algemeen",
      "icon": "general",
      "items": [
        {
          "id": "q1",
          "question": "Hoe kan ik contact met jullie opnemen?",
          "answer": "Je kunt ons bereiken via het contactformulier op onze website of door een e-mail te sturen naar contact@createe.nl. We streven ernaar om je binnen 2 werkdagen verder te helpen."
        },
        {
          "id": "q2",
          "question": "Hebben jullie ook een fysieke winkel?",
          "answer": "Createe is een exclusieve online webshop. Door alleen online te werken, kunnen we onze unieke collectie overal aan te bieden en onze prijzen eerlijk houden. Heb je hulp nodig bij de Design Studio? Dan plannen we graag een persoonlijke online meeting met je in."
        },
        {
          "id": "q3",
          "question": "Hoe kan ik mijn polo's het beste wassen?",
          "answer": "Om je polo zo lang mogelijk mooi te houden, adviseren we je om deze binnenstebuiten te wassen op maximaal 30°C met een laag toerental. Gebruik liever geen wasdroger, maar laat de kleding aan de lucht drogen. Zo bescherm je de stof en de bedrukking het best."
        }
      ]
    },
    {
      "id": "2",
      "title": "Bestellingen",
      "icon": "orders",
      "items": [
        {
          "id": "q4",
          "question": "Hoe kan ik mijn bestelling nog wijzigen?",
          "answer": "Zolang je bestelling ons magazijn nog niet heeft verlaten, kunnen we deze voor je aanpassen. Neem in dat geval direct contact op met onze klantenservice en houd je ordernummer bij de hand, dan regelen we het direct voor je."
        },
        {
          "id": "q5",
          "question": "Waar kan ik mijn facturen vinden?",
          "answer": "Je factuur wordt altijd opgenomen in de bevestigingsmail van de bestelling. Je kunt de factuur ook terugvinden in je account. Als je de factuur niet kunt vinden, neem dan contact met ons op zodat we je een nieuw exemplaar kunnen toesturen."
        }
      ]
    },
    {
      "id": "3",
      "title": "Verzending",
      "icon": "shipping",
      "items": [
        {
          "id": "q6",
          "question": "Wat zijn de huidige levertijden?",
          "answer": "Onze standaardproducten worden meestal binnen 1 tot 3 werkdagen verstuurd. Heb je gekozen voor de Design Studio? Houd dan rekening met een langere levertijd vanwege het persoonlijke ontwerpproces."
        },
        {
          "id": "q7",
          "question": "Kan ik mijn pakket volgen?",
          "answer": "Zeker weten. Zodra je pakket onderweg is, sturen we je een e-mail met een Track & Trace-code. Hiermee kun je precies zien wanneer de bezorger bij je voor de deur staat."
        }
      ]
    },
    {
      "id": "4",
      "title": "Retouren",
      "icon": "returns",
      "items": [
        {
          "id": "q8",
          "question": "Hoe werkt het retourproces?",
          "answer": "Je kunt je retourzending makkelijk aanmelden via ons online portaal. Na de aanmelding ontvang je een verzendlabel van ons. Verpak het product zorgvuldig in de originele verpakking en lever het in bij een servicepunt. Binnen 14 dagen na ontvangst storten we het bedrag weer op je rekening."
        },
        {
          "id": "q9",
          "question": "Moet ik zelf betalen voor mijn retour?",
          "answer": "De kosten voor een standaard retourzending betaal je zelf. Wil je het product echter omruilen voor een andere maat of kleur? Dan nemen wij de retourkosten voor onze rekening."
        },
        {
          "id": "q10",
          "question": "Kan ik producten van de Design Studio retourneren?",
          "answer": "Nee, omdat de kleding specifiek voor u op maat wordt gemaakt en bedrukt met een uniek, persoonlijk ontwerp, is het herroepingsrecht uitgesloten. Dit betekent dat bestelde kledingstukken niet geretourneerd of geruild kunnen worden, tenzij er sprake is van een aantoonbare fabricagefout of beschadiging bij ontvangst."
        }
      ]
    },
    {
      "id": "5",
      "title": "Design Studio",
      "icon": "studio",
      "items": [
        {
          "id": "q11",
          "question": "Hoe ziet het proces van de Design Studio eruit?",
          "answer": "Nadat je de configurator hebt ingevuld, bestuderen we je aanvraag en nemen we bij vragen contact met je op. Zodra je aanvraag is goedgekeurd en de betaling is voldaan, gaan we direct voor je aan de slag. We maken vervolgens twee unieke designs die we je ter beoordeling opsturen. Jij kiest je favoriete ontwerp en geeft ons je feedback. Hiermee werken we het design uit tot het definitieve resultaat, dat we vervolgens op je premium kleding bedrukken."
        },
        {
          "id": "q12",
          "question": "Hoe lang duurt het voordat ik mijn eigen design heb?",
          "answer": "Zodra je aanvraag is goedgekeurd, sturen we je binnen 10 werkdagen de eerste twee designs. Na jouw feedback leveren we binnen 5 werkdagen het eindresultaat aan ter goedkeuring. Ben je helemaal tevreden? Dan wordt je bestelling binnen 1 tot 3 werkdagen verzonden."
        },
        {
          "id": "q13",
          "question": "Kan ik mijn idee ook persoonlijk met jullie bespreken?",
          "answer": "Natuurlijk! We plannen graag een kosteloze online meeting met je in om je ideeën persoonlijk door te neem met een van onze specialisten."
        },
        {
          "id": "q14",
          "question": "Kan ik de €25,- voucher direct voor mijn huidige bestelling gebruiken?",
          "answer": "Nee, dit is op de huidige bestelling helaas niet mogelijk."
        }
      ]
    }
  ]
};

export const contactFaqQuery = () => queryOptions({
  queryKey: ["site-settings", "contact-faq"],
  queryFn: async (): Promise<FaqConfig> => {
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "contact_faq").maybeSingle();
    if (error) throw new Error("Veelgestelde vragen konden niet worden geladen.");
    const parsed = faqSchema.safeParse(data?.value);
    return parsed.success ? parsed.data : defaultFaq;
  }, staleTime: 60000,
});
