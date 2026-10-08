import { sanitizeDescription } from "@/lib/shop";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check, ArrowDown, ArrowRight, MessageCircle, Pencil, Shirt, Flag, Upload, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Stars } from "@/components/shop/Reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { submitStudio } from "@/lib/contact.functions";
import { formatPrice } from "@/lib/shop";
import { discountedTiers, imageFor, studioProducts, studioQuery, tiersFor } from "@/lib/studio";

export const Route = createFileRoute("/design-studio")({
  head: () => ({ meta: [
    { title: "CREATEE Design Studio — jouw eigen design" },
    { name: "description", content: "Unieke premium kleding voor jouw groep. Drie persoonlijke designvoorstellen en twee feedbackrondes bij CREATEE Design Studio." },
    { property: "og:title", content: "CREATEE Design Studio — jouw eigen design" },
    { property: "og:description", content: "Breng je idee tot leven. Vraag jouw persoonlijke CREATEE ontwerp aan." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(studioQuery()),
  component: DesignStudio,
});

const schema = z.object({
  name: z.string().trim().min(1, "Vul je naam in").max(100),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255),
  phone: z.string().trim().max(30).optional(),
  quantity: z.coerce.number().int().min(1).max(10000).optional(),
  message: z.string().trim().min(1, "Vertel iets over je idee").max(3000),
});

const steps = [
  { title: "Pitch", icon: MessageCircle, text: "Jij bepaalt de speelrichting. Vertel ons wat je zoekt: denk aan een unieke gelegenheid, het team waarvoor de kleding is, hoe het eruit moet zien." },
  { title: "Approach", icon: Pencil, text: "Onze designers vertalen jouw visie naar drie unieke ontwerpen. Zo heb je een duidelijke keuze en verschillende creatieve interpretaties." },
  { title: "Reading the green", icon: Shirt, text: "Kies je favoriete design en geef feedback. Op basis van jouw input werken wij het ontwerp uit tot de definitieve versie." },
  { title: "Putting it on", icon: Flag, text: "Het design staat vast. Wij bedrukken jouw nieuwe kleding op onze premium kleding en leveren het bij je. Tijd om te shinen." },
];

function DesignStudio() {
  const { data: studio } = useSuspenseQuery(studioQuery());
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gender, setGender] = useState<"Heren"|"Dames">("Heren");
  const [selected, setSelected] = useState("");
  const [color, setColor] = useState("");
  const [qty, setQty] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const options = studioProducts.filter(o=>o.gender==="Beide"||o.gender===gender);
  const selectedOption = options.find(o=>o.name===selected);
  const colors = selectedOption?.colors.filter(c=>c.gender==="Beide"||c.gender===gender) ?? [];
  const tiers = selectedOption ? discountedTiers(studio, selectedOption) : null;
  const baseTiers = selectedOption ? tiersFor(studio, selectedOption) : null;
  const discount = selectedOption ? (studio.discounts?.[selectedOption.name] ?? 0) : 0;
  const unit = tiers && qty>0 ? (qty<=3?tiers[0]:qty<=9?tiers[1]:tiers[2]) : 0;
  const fee = studio.service_price ?? 25;
  const feeWas = studio.service_compare ?? 0;
  const feePct = feeWas > fee ? Math.round((1 - fee/feeWas)*100) : 0;
  const imgFor = (name: string, _fallback?: string) => { const p = studioProducts.find(o=>o.name===name)!; return imageFor(studio, p, gender, name===selected ? color : ""); };
  const previewImg = selectedOption ? imgFor(selectedOption.name) : "";
  const activeHex = colors.find(c=>c.name===color)?.hex;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const clean = Object.fromEntries(Object.entries(Object.fromEntries(fd)).filter(([,v])=>v!==""));
    const parsed = schema.safeParse(clean);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "Controleer het formulier"); return; }
    const other = selected==="anders";
    const otherProduct = String(fd.get("other_product") ?? "").trim().slice(0,200);
    const otherColor = String(fd.get("other_color") ?? "").trim().slice(0,100);
    if (other && !otherProduct) { toast.error("Vul in welk product je zoekt"); return; }
    setBusy(true);
    const paths: string[] = [];
    for (const f of files) {
      const ext = f.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"") || "jpg";
      const path = `requests/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("studio-assets").upload(path, f, { contentType: f.type });
      if (error) { setBusy(false); toast.error(`Uploaden van ${f.name} mislukt`); return; }
      paths.push(path);
    }
    const shownColor = other ? otherColor : color;
    const details = [`Doelgroep: ${gender}`, `Product: ${other ? `Anders – ${otherProduct}` : selectedOption?.name ?? "Niet gekozen"}`, shownColor ? `Kleur: ${shownColor}` : "", unit ? `Indicatie kleding: ${qty} × ${formatPrice(unit)}` : "", ...paths.map(p=>`Bestand: ${p}`), fd.get("meeting") ? "Online afspraak gewenst" : ""].filter(Boolean).join("\n");
    const { other_product: _a, other_color: _b, ...rest } = parsed.data as Record<string, unknown>;
    const res = await submitStudio({ data: { ...(rest as any), message: `${parsed.data.message}\n\n${details}` } }).catch(() => ({ ok: false }));
    setBusy(false);
    if (!res.ok) { toast.error("Versturen mislukt, probeer opnieuw."); return; }
    setSent(true);
  }

  return <ShopLayout page="studio"><div className="studio-atelier">
    {/* HERO */}
    <section data-section="studio-intro" className="atelier-hero">
      <div className="atelier-grid" aria-hidden />
      <div className="relative mx-auto grid max-w-[1400px] gap-12 px-5 py-16 sm:px-10 md:py-24 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)] lg:items-center">
        <div className="atelier-rise">
          <p className="atelier-kicker">Design service</p>
          <h1 className="atelier-title">CREATEE<br /><span>Design Studio</span></h1>
          <p className="mt-8 max-w-xl text-base leading-relaxed opacity-90">Dé plek waar we jouw persoonlijke ideeën vertalen naar unieke, exclusieve designs op onze premium kleding. Wij nemen al het werk volledig uit handen. Het resultaat? Een premium eindproduct dat naadloos past bij de gelegenheid en jullie identiteit.</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">{["Drie unieke, professioneel uitgewerkte designvoorstellen.","Twee feedbackrondes om het gekozen ontwerp te perfectioneren.","Hoogwaardige bedrukking op onze premium kleding.","Een eindproduct dat perfect past bij de gelegenheid en jouw groep."].map(t=><li key={t} className="atelier-check"><span><Check className="size-3.5" /></span>{t}</li>)}</ul>
        </div>
        <aside className="atelier-ticket">
          {feePct>0 && <div className="atelier-stamp">-{feePct}%</div>}
          <p className="atelier-kicker text-primary">Design service</p>
          <p className="mt-3 flex items-baseline gap-3">{feeWas>fee && <s className="text-xl text-muted-foreground">{formatPrice(feeWas)}</s>}<span className="font-display text-6xl font-bold tracking-tight">{formatPrice(fee)}</span></p>
          {feePct>0 && <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-destructive">Nu {feePct}% korting</p>}
          <div className="atelier-perf" aria-hidden />
          <p className="text-sm leading-relaxed">Ga je bestellen met jouw gekozen design? Dan ontvang je €12,50 terug als voucher op je bestelling.</p>
          <Button asChild className="mt-6 h-12 w-full"><a href="#aanvraag">Vraag je design aan <ArrowDown /></a></Button>
        </aside>
      </div>
      {/* STEPS */}
      <div className="relative mx-auto max-w-[1400px] px-5 pb-20 sm:px-10">
        <h2 className="atelier-section-title text-primary-foreground">Hoe werkt het</h2>
        <ol className="atelier-steps">{steps.map((s,i)=><li key={s.title} className="atelier-step">
          <span className="atelier-num" aria-hidden>0{i+1}</span>
          <span className="atelier-icon"><s.icon className="size-5" /></span>
          <h3 className="mt-5 text-sm font-bold uppercase tracking-wider">{i+1}. {s.title}</h3>
          <p className="mt-3 text-sm leading-relaxed opacity-80">{s.text}</p>
        </li>)}</ol>
      </div>
    </section>

    {/* SCORECARD */}
    {studio.reviews.length > 0 && <section data-section="studio-scorecard" className="atelier-board">
      <div className="mx-auto max-w-[1400px] px-5 pt-20 sm:px-10">
        <div className="mb-12 flex flex-wrap items-center justify-center gap-4"><h2 className="atelier-section-title !mb-0 text-primary">Onze scorecard</h2><Stars /></div>
      </div>
      <div className="studio-marquee pb-20" style={{ ["--marquee-duration" as string]: `${Math.max(20, studio.reviews.length * 7)}s` }}>
        <div className="studio-marquee-track">{[0, 1].map((copy) => studio.reviews.map((r, i) => <ScoreCard key={`${copy}-${r.id}`} r={r} i={i} hidden={copy === 1} />))}</div>
      </div>
      <div>
      </div>
    </section>}

    {/* FORM */}
    <section data-section="studio-form" id="aanvraag" className="atelier-form-wrap scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-4 py-16 sm:px-10 md:py-24">
      {sent ? <div className="atelier-card py-20 text-center" role="status"><Check className="mx-auto mb-5 size-12 text-primary" /><h2 className="text-3xl font-bold text-primary">Bedankt voor je aanvraag!</h2><p className="mt-3">We nemen zo snel mogelijk contact met je op.</p></div> :
      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="atelier-card space-y-10 p-6 sm:p-10">
          <div className="atelier-toggle" aria-label="Doelgroep">{(["Heren","Dames"] as const).map(g=><button key={g} type="button" aria-pressed={gender===g} className={gender===g?"is-on":""} onClick={()=>{setGender(g);setSelected("");setColor("");}}>{g}</button>)}</div>
          <fieldset><legend className="atelier-legend">Kies een product</legend><div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">{options.map(o=><button key={o.name} type="button" className={`atelier-sample ${selected===o.name?"is-on":""}`} aria-pressed={selected===o.name} onClick={()=>{setSelected(o.name);setColor("");}}><span className="block overflow-hidden"><img src={imgFor(o.name,o.image)} alt={o.name} /></span><span className="atelier-sample-label">{o.name}</span></button>)}<button type="button" className={`atelier-sample atelier-blank ${selected==="anders"?"is-on":""}`} aria-pressed={selected==="anders"} onClick={()=>{setSelected("anders");setColor("");}}>Anders</button></div>{selected==="anders" && <div className="mt-5"><Label htmlFor="other_product" className="text-xs uppercase tracking-wider">Welk product zoek je?</Label><Input id="other_product" name="other_product" required maxLength={200} placeholder="Bijv. rugbyshirt, sokken, cap…" className="atelier-input mt-2 h-12" /></div>}</fieldset>
          <fieldset><legend className="atelier-legend">Kies een kleur</legend>{colors.length ? <div className="flex flex-wrap gap-4">{colors.map(c=><button key={c.name} type="button" aria-pressed={color===c.name} onClick={()=>setColor(c.name)} className={`atelier-swatch ${color===c.name?"is-on":""}`}><span style={{background:c.hex}} />{c.name}</button>)}</div> : selected==="anders" ? <Input id="other_color" name="other_color" aria-label="Gewenste kleur" maxLength={100} placeholder="Welke kleur zoek je?" className="atelier-input h-12" /> : <p className="text-sm text-muted-foreground">Selecteer eerst een product.</p>}</fieldset>
          <div className="grid gap-6 sm:grid-cols-[2fr_1fr]"><div><Label htmlFor="message" className="atelier-legend">Wat is je idee?</Label><Textarea id="message" name="message" required maxLength={2600} rows={6} placeholder="Beschrijf jouw idee. Welke stijl past bij jouw groep?" className="atelier-input" /></div><div><Label htmlFor="quantity" className="atelier-legend">Aantal stuks</Label><Input id="quantity" name="quantity" type="number" onChange={e=>setQty(Number(e.target.value)||0)} min={1} max={10000} placeholder="Bijv. 8" className="atelier-input h-12" /></div></div>
          <div><Label htmlFor="reference" className="atelier-legend">Referentieafbeeldingen</Label><label htmlFor="reference" className="flex cursor-pointer flex-col items-center justify-center gap-2 border-2 border-dashed border-border px-4 py-8 text-center text-sm hover:border-primary"><Upload className="size-6 text-primary" /><span>Klik om afbeeldingen te uploaden</span><span className="text-xs text-muted-foreground">Max. 5 bestanden, 10 MB per stuk</span></label><input id="reference" type="file" accept="image/*,application/pdf" multiple className="sr-only" onChange={e=>{const picked=Array.from(e.target.files??[]);const ok=picked.filter(f=>f.size<=10*1024*1024);if(ok.length<picked.length)toast.error("Bestanden groter dan 10 MB zijn overgeslagen");setFiles(prev=>[...prev,...ok].slice(0,5));e.target.value="";}} />{files.length>0 && <ul className="mt-3 space-y-2">{files.map((f,i)=><li key={i} className="flex items-center justify-between gap-3 border border-border px-3 py-2 text-sm"><span className="truncate">{f.name}</span><button type="button" aria-label={`Verwijder ${f.name}`} onClick={()=>setFiles(files.filter((_,j)=>j!==i))}><X className="size-4" /></button></li>)}</ul>}</div>
          <fieldset><legend className="atelier-legend">Contact</legend><div className="grid gap-4 md:grid-cols-3"><div><Label htmlFor="name" className="text-xs uppercase tracking-wider">Naam</Label><Input id="name" name="name" autoComplete="name" required maxLength={100} className="atelier-input mt-2 h-12" /></div><div><Label htmlFor="email" className="text-xs uppercase tracking-wider">E-mailadres</Label><Input id="email" name="email" autoComplete="email" type="email" required maxLength={255} className="atelier-input mt-2 h-12" /></div><div><Label htmlFor="phone" className="text-xs uppercase tracking-wider">Telefoonnummer</Label><Input id="phone" name="phone" type="tel" autoComplete="tel" maxLength={30} className="atelier-input mt-2 h-12" /></div></div><label className="mt-5 flex items-start gap-3 text-sm"><input type="checkbox" name="meeting" className="mt-0.5 size-4 accent-primary" />Ja, ik wil mijn idee graag persoonlijk bespreken via een online (video) call.</label></fieldset>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start space-y-5">
          <div className="atelier-preview" style={activeHex?{["--swatch" as string]:activeHex}:undefined}>
            {selectedOption ? <img key={previewImg} src={previewImg} alt={`${selectedOption.name}${color?` in ${color}`:""}`} className="atelier-fade" /> : <div className="atelier-preview-empty"><Shirt className="size-10" /></div>}
            {selectedOption && <span className="atelier-preview-tag">{selectedOption.name}{color?` · ${color}`:""}</span>}
          </div>
          <div className="atelier-receipt"><h3 className="atelier-legend !mb-4">Prijzen & overzicht</h3>
            <div className="flex justify-between gap-4 text-sm"><span>Design Studio {feePct>0 && <span className="ml-2 bg-destructive px-1.5 py-0.5 text-[10px] font-semibold text-destructive-foreground">Nu {feePct}% korting</span>}</span><span className="tabular-nums">{feeWas>fee && <s className="mr-2 text-muted-foreground">{formatPrice(feeWas)}</s>}{formatPrice(fee)}</span></div>
            <div className="mt-3 flex justify-between gap-4 border-t border-dashed border-border pt-3 text-xs"><span>{selectedOption ? `${selectedOption.name}${qty?` · ${qty} stuks`:""}` : "Kleding & bedrukking"}</span><span className="tabular-nums">{unit ? `${qty} × ${formatPrice(unit)}` : selectedOption ? `vanaf ${formatPrice(tiers![2])} p/st` : "Op aanvraag"}</span></div>
            {tiers && baseTiers && <p className="mt-2 text-[11px] text-muted-foreground">{discount>0 && <span className="mr-1 bg-destructive px-1 font-semibold text-destructive-foreground">-{discount}%</span>}Staffel: 1–3 st. {discount>0 && <s>{formatPrice(baseTiers[0])}</s>} {formatPrice(tiers[0])} · 4–9 st. {discount>0 && <s>{formatPrice(baseTiers[1])}</s>} {formatPrice(tiers[1])} · 10+ st. {discount>0 && <s>{formatPrice(baseTiers[2])}</s>} {formatPrice(tiers[2])}</p>}
            <div className="mt-4 flex items-baseline justify-between gap-4 border-t-2 border-primary pt-4 font-bold"><span className="text-sm uppercase tracking-wider">Totaal (incl. btw)</span><span key={fee+unit*qty} className="atelier-pop font-display text-2xl tabular-nums">{formatPrice(fee + unit*qty)}</span></div>
            <p className="mt-4 inline-block bg-secondary px-2 py-1 text-[11px] font-semibold text-primary">€ 12,50 voucher na bestellen</p>
            <p className="mt-2 text-[11px] text-muted-foreground">De definitieve prijs is afhankelijk van de designs en verdere specificaties.</p>
            <Button type="submit" size="lg" disabled={busy} className="atelier-submit mt-6 h-14 w-full">{busy?"Versturen…":"Verzend aanvraag"} <ArrowRight /></Button>
          </div>
        </aside>
      </form>}
      </div>
    </section>
  </div></ShopLayout>;
}
