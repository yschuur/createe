import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ArrowDown, MessageCircle, Pencil, Shirt, Flag } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Stars } from "@/components/shop/Reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { listProductsQuery, formatPrice } from "@/lib/shop";
import polo from "@/assets/studio-polo.jpg.asset.json";
import tee from "@/assets/studio-tee.jpg.asset.json";
import hoodie from "@/assets/studio-hoodie.jpg.asset.json";
import performance from "@/assets/studio-performance.jpg.asset.json";
import photo1 from "@/assets/studio-1.jpg.asset.json";
import photo2 from "@/assets/studio-2.jpg.asset.json";
import photo3 from "@/assets/studio-3.jpg.asset.json";
import photo4 from "@/assets/studio-4.jpg.asset.json";
import photo5 from "@/assets/studio-5.jpg.asset.json";
import photo6 from "@/assets/studio-6.jpg.asset.json";

export const Route = createFileRoute("/design-studio")({
  head: () => ({ meta: [
    { title: "CREATEE Design Studio — jouw eigen design" },
    { name: "description", content: "Unieke premium kleding voor jouw groep. Drie persoonlijke designvoorstellen en twee feedbackrondes bij CREATEE Design Studio." },
    { property: "og:title", content: "CREATEE Design Studio — jouw eigen design" },
    { property: "og:description", content: "Breng je idee tot leven. Vraag jouw persoonlijke CREATEE ontwerp aan." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(listProductsQuery()),
  component: DesignStudio,
});

type StudioProduct = { name: string; gender: "Heren"|"Dames"|"Beide"; image: string; tiers: [number,number,number]; colors: { name: string; hex: string; gender: "Heren"|"Dames"|"Beide" }[] };
// Productkeuzes, staffelprijzen en kleuren uit de originele Shopify-configurator.
const studioProducts: StudioProduct[] = [
  { name: "HYBR™ polo", gender: "Beide", image: polo.url, tiers: [70,60,50], colors: [{name:"Beige",hex:"#d7c4a5",gender:"Beide"},{name:"Leaf Green",hex:"#41835f",gender:"Beide"},{name:"Ocean Blue",hex:"#4d708f",gender:"Beide"}] },
  { name: "Loose fit tee", gender: "Heren", image: tee.url, tiers: [50,40,30], colors: [{name:"Sand",hex:"#d7c4a5",gender:"Heren"},{name:"Antracite",hex:"#5e6065",gender:"Heren"},{name:"Black",hex:"#000000",gender:"Heren"},{name:"Luxe White",hex:"#ffffff",gender:"Heren"}] },
  { name: "Hoodie", gender: "Beide", image: hoodie.url, tiers: [80,70,60], colors: [{name:"Off-white",hex:"#e9decb",gender:"Beide"},{name:"Misty Blue",hex:"#6693b8",gender:"Beide"},{name:"Leaf Green",hex:"#41835f",gender:"Beide"},{name:"Navy",hex:"#38526a",gender:"Beide"},{name:"Luxe White",hex:"#ffffff",gender:"Beide"},{name:"Black",hex:"#000000",gender:"Beide"}] },
  { name: "Performance shirt", gender: "Heren", image: performance.url, tiers: [40,35,25], colors: [{name:"Vanilla",hex:"#d7c4a5",gender:"Heren"},{name:"Arctic White",hex:"#ffffff",gender:"Heren"},{name:"Bottle Green",hex:"#275c38",gender:"Heren"},{name:"Jet Black",hex:"#333333",gender:"Heren"}] },
  { name: "Performance tee", gender: "Dames", image: performance.url, tiers: [40,35,25], colors: [{name:"Arctic White",hex:"#ffffff",gender:"Dames"},{name:"Jet Black",hex:"#333333",gender:"Dames"},{name:"Bottle Green",hex:"#275c38",gender:"Dames"},{name:"Electric Orange",hex:"#f59920",gender:"Dames"},{name:"Sapphire Blue",hex:"#00b7cf",gender:"Dames"}] },
];

const schema = z.object({
  name: z.string().trim().min(1, "Vul je naam in").max(100),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255),
  phone: z.string().trim().max(30).optional(),
  occasion: z.string().trim().max(200).optional(),
  quantity: z.coerce.number().int().min(1).max(10000).optional(),
  message: z.string().trim().min(1, "Vertel iets over je idee").max(3000),
});

function DesignStudio() {
  const { data: products } = useSuspenseQuery(listProductsQuery());
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gender, setGender] = useState<"Heren"|"Dames">("Heren");
  const [selected, setSelected] = useState("");
  const [color, setColor] = useState("");
  const options = studioProducts.filter(o=>o.gender==="Beide"||o.gender===gender);
  const selectedOption = options.find(o=>o.name===selected);
  const colors = selectedOption?.colors.filter(c=>c.gender==="Beide"||c.gender===gender) ?? [];
  const [qty, setQty] = useState(0);
  const unit = selectedOption && qty>0 ? (qty<=3?selectedOption.tiers[0]:qty<=9?selectedOption.tiers[1]:selectedOption.tiers[2]) : 0;
  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const entries = Object.fromEntries(fd);
    const clean = Object.fromEntries(Object.entries(entries).filter(([,v])=>v!==""));
    const parsed = schema.safeParse(clean);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Controleer het formulier"); return; }
    const details = [`Doelgroep: ${gender}`, `Product: ${selectedOption?.name ?? "Anders"}`, color ? `Kleur: ${color}` : "", unit ? `Indicatie kleding: ${qty} × ${formatPrice(unit)}` : "", fd.get("reference") ? `Referentie: ${fd.get("reference")}` : "", fd.get("meeting") ? "Online afspraak gewenst" : ""].filter(Boolean).join("\n");
    setBusy(true);
    const { error } = await supabase.from("design_requests").insert({ ...parsed.data, message: `${parsed.data.message}\n\n${details}` } as never);
    setBusy(false);
    if (error) { toast.error("Versturen mislukt, probeer opnieuw."); return; }
    setSent(true);
  }
  return <ShopLayout><div className="bg-primary py-8 md:py-12">
    <section className="editorial-section p-6 sm:p-10 md:p-14">
      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_260px]">
        <div><h1 className="editorial-title text-3xl sm:text-4xl md:text-5xl">CREATEE<br />Design Studio</h1><p className="mt-5 max-w-lg text-sm leading-relaxed">Dé plek waar we jouw persoonlijke ideeën vertalen naar unieke, exclusieve designs op onze premium kleding. Wij nemen al het werk volledig uit handen. Het resultaat? Een premium eindproduct dat naadloos past bij de gelegenheid en jullie identiteit.</p><ul className="mt-6 space-y-3 text-sm">{["Drie unieke, professioneel uitgewerkte designvoorstellen.","Twee feedbackrondes om het gekozen ontwerp te perfectioneren.","Hoogwaardige bedrukking op onze premium kleding.","Een eindproduct dat perfect past bij de gelegenheid en jouw groep."].map(t=><li key={t} className="flex gap-2"><Check className="size-4 shrink-0 text-primary" />{t}</li>)}</ul></div>
        <aside className="self-start border border-primary p-5"><p className="text-xs font-bold uppercase text-primary">Design service</p><p className="mt-2 flex items-baseline gap-3"><s className="text-lg text-muted-foreground">€50</s><span className="text-4xl font-bold">€25</span></p><p className="mt-1 text-xs font-semibold text-destructive">Nu 50% korting</p><p className="mt-4 text-xs leading-relaxed">Ga je bestellen met jouw gekozen design? Dan ontvang je €12,50 terug als voucher op je bestelling.</p><Button asChild className="mt-5 w-full"><a href="#aanvraag">Vraag je design aan <ArrowDown /></a></Button></aside>
      </div>
      <h2 className="mb-7 mt-12 text-center text-xl font-bold uppercase text-primary">Hoe werkt het</h2>
      <ol className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">{[
        { title: "Pitch", icon: MessageCircle, text: "Jij bepaalt de speelrichting. Vertel ons wat je zoekt: denk aan een unieke gelegenheid, het team waarvoor de kleding is, hoe het eruit moet zien." },
        { title: "Approach", icon: Pencil, text: "Onze designers vertalen jouw visie naar drie unieke ontwerpen. Zo heb je een duidelijke keuze en verschillende creatieve interpretaties." },
        { title: "Reading the green", icon: Shirt, text: "Kies je favoriete design en geef feedback. Op basis van jouw input werken wij het ontwerp uit tot de definitieve versie." },
        { title: "Putting it on", icon: Flag, text: "Het design staat vast. Wij bedrukken jouw nieuwe kleding op onze premium kleding en leveren het bij je. Tijd om te shinen." },
      ].map((s,i)=><li key={s.title}><s.icon className="mb-3 size-5 text-primary" /><h3 className="text-xs font-bold uppercase text-primary">{i+1}. {s.title}</h3><p className="mt-2 text-xs leading-relaxed">{s.text}</p></li>)}</ol>
    </section>
    <section className="mx-auto max-w-[1500px] px-4 py-10"><div className="mb-6 flex flex-wrap items-center justify-center gap-4"><h2 className="text-xl font-bold uppercase text-primary-foreground">Onze scorecard</h2><Stars /></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">{[photo1,photo2,photo3,photo4,photo5,photo6].map((p,i)=><figure key={p.asset_id} className="bg-shop-surface p-2"><img src={p.url} alt={`Persoonlijk CREATEE ontwerp voor een klant ${i+1}`} className="aspect-square w-full object-cover" loading="lazy" /><figcaption className="px-1 pb-2 pt-3"><Stars /><span className="mt-2 block text-[10px] font-semibold uppercase text-primary">CREATEE Design Studio</span></figcaption></figure>)}</div></section>
    <section id="aanvraag" className="editorial-section scroll-mt-24 p-6 sm:p-10 md:p-12">
      {sent ? <div className="py-16 text-center" role="status"><Check className="mx-auto mb-5 size-12 text-primary" /><h2 className="text-3xl font-bold text-primary">Bedankt voor je aanvraag!</h2><p className="mt-3">We nemen zo snel mogelijk contact met je op.</p></div> : <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid grid-cols-2" aria-label="Doelgroep">{["Heren","Dames"].map(g=><Button key={g} type="button" variant={gender===g?"outline":"ghost"} aria-pressed={gender===g} className="h-12 rounded-none uppercase" onClick={()=>{setGender(g as "Heren"|"Dames");setSelected("");setColor("");}}>{g}</Button>)}</div>
        <fieldset><legend className="mb-4 text-sm font-bold uppercase text-primary">Kies een product</legend><div className="grid grid-cols-2 gap-3 sm:grid-cols-5">{options.map(o=><Button key={o.name} type="button" variant="outline" className={`studio-option ${selected===o.name?"ring-2 ring-primary":""}`} aria-pressed={selected===o.name} onClick={()=>{setSelected(o.name);setColor("");}}><img src={o.image} alt={o.name} /><span>{o.name}</span></Button>)}<Button type="button" variant="outline" className={`min-h-36 h-full text-lg font-bold uppercase ${selected==="anders"?"ring-2 ring-primary":""}`} aria-pressed={selected==="anders"} onClick={()=>{setSelected("anders");setColor("");}}>Anders</Button></div></fieldset>
        <fieldset><legend className="mb-3 block text-sm font-bold uppercase text-primary">Kies een kleur</legend>{colors.length ? <div className="flex flex-wrap gap-3">{colors.map(c=><button key={c.name} type="button" aria-pressed={color===c.name} onClick={()=>setColor(c.name)} className={`flex items-center gap-2 border px-3 py-2 text-xs ${color===c.name?"border-primary ring-2 ring-primary":"border-border"}`}><span className="size-5 rounded-full border border-border" style={{background:c.hex}} />{c.name}</button>)}</div> : <p className="text-sm text-muted-foreground">{selected==="anders"?"Vertel ons in je idee welke kleur je zoekt.":"Selecteer eerst een product."}</p>}</fieldset>
        <div className="grid gap-5 sm:grid-cols-[2fr_1fr]"><div><Label htmlFor="message" className="mb-3 block font-bold uppercase text-primary">Wat is je idee?</Label><Textarea id="message" name="message" required maxLength={2600} rows={4} placeholder="Beschrijf jouw idee. Welke stijl past bij jouw groep?" /></div><div><Label htmlFor="quantity" className="mb-3 block font-bold uppercase text-primary">Aantal stuks</Label><Input id="quantity" name="quantity" type="number" onChange={e=>setQty(Number(e.target.value)||0)} min={1} max={10000} placeholder="Bijv. 8" className="h-12" /><Label htmlFor="occasion" className="mb-2 mt-5 block">Gelegenheid</Label><Input id="occasion" name="occasion" maxLength={200} placeholder="Bijv. golfweekend" /></div></div>
        <div><Label htmlFor="reference" className="mb-3 block font-bold uppercase text-primary">Referentieafbeeldingen</Label><Input id="reference" name="reference" type="url" maxLength={300} placeholder="Link naar je voorbeeld of inspiratie" className="h-12" /></div>
        <fieldset><legend className="mb-4 text-sm font-bold uppercase text-primary">Contact</legend><div className="grid gap-4 md:grid-cols-3"><div><Label htmlFor="name">Naam</Label><Input id="name" name="name" autoComplete="name" required maxLength={100} className="mt-2 h-12" /></div><div><Label htmlFor="email">E-mailadres</Label><Input id="email" name="email" autoComplete="email" type="email" required maxLength={255} className="mt-2 h-12" /></div><div><Label htmlFor="phone">Telefoonnummer</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={30} className="mt-2 h-12" /></div></div><label className="mt-5 flex items-start gap-3 text-xs"><input type="checkbox" name="meeting" className="mt-0.5 size-4 accent-primary" />Ja, ik wil mijn idee graag persoonlijk bespreken via een online (video) call.</label></fieldset>
        <div className="border border-primary p-5"><h3 className="mb-4 text-xs font-bold uppercase text-primary">Prijzen & overzicht</h3>
          <div className="flex justify-between gap-4 text-sm"><span>Design Studio <span className="ml-2 bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">Nu 50% korting</span></span><span><s className="mr-2 text-muted-foreground">{formatPrice(50)}</s>{formatPrice(25)}</span></div>
          <div className="mt-3 flex justify-between gap-4 border-t border-border pt-3 text-xs"><span>{selectedOption ? `${selectedOption.name}${qty?` · ${qty} stuks`:""}` : "Kleding & bedrukking"}</span><span>{unit ? `${qty} × ${formatPrice(unit)}` : selectedOption ? `vanaf ${formatPrice(selectedOption.tiers[2])} p/st` : "Op aanvraag"}</span></div>
          {selectedOption && <p className="mt-2 text-[11px] text-muted-foreground">Staffel: 1–3 st. {formatPrice(selectedOption.tiers[0])} · 4–9 st. {formatPrice(selectedOption.tiers[1])} · 10+ st. {formatPrice(selectedOption.tiers[2])}</p>}
          <div className="mt-3 flex justify-between gap-4 border-t border-primary pt-3 text-sm font-bold"><span>Totaal (incl. btw)</span><span>{formatPrice(25 + unit*qty)}</span></div>
          <p className="mt-3 inline-block bg-secondary px-2 py-1 text-[11px] font-semibold text-primary">€ 12,50 voucher na bestellen</p>
          <p className="mt-2 text-[11px] text-muted-foreground">De definitieve prijs is afhankelijk van de designs en verdere specificaties.</p></div>
        <div className="text-center"><Button type="submit" size="lg" disabled={busy}>{busy?"Versturen…":"Verzend aanvraag"}</Button></div>
      </form>}
    </section>
  </div></ShopLayout>;
}
