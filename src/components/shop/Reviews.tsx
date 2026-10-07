import { Star } from "lucide-react";

const reviews = [
  { name: "Peter Lankhorst", title: "Perfecte polo Golf event Oostenrijk", text: "Voor een jaarlijks golf event in Oostenrijk, wilde ik mijn gasten verrassen met een unieke polo. Nu heb ik contact met Createe waarna we ideeën werden gedeeld, kwamen er prachtige ontwerpen. Toen maar, maar geweldig goed ontvangen. Perfecte product en excellente service." },
  { name: "Freddy Hamers", title: "Topshirt met originele opdruk", text: "Topshirt met een originele opdruk. Draagt heel fijn en blijft ook mooi na het wassen. Echt een aanrader en ga zeker meer bestellen in deze site." },
  { name: "Jan", title: "Top shirt!", text: "Heel mooi shirt van goede kwaliteit! Zeker een aanrader." },
  { name: "Jan", title: "Heerlijk t-shirt", text: "Heerlijk t-shirt. Mooie opdruk. Heb ook een polo besteld met vergelijkbare geweldige kwaliteit." },
];
export function Reviews() {
  return <section aria-label="Klantbeoordelingen" className="border-y border-border bg-muted/25 px-5 py-9"><div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[140px_1fr]">
    <div><p className="font-bold">Uitstekend</p><Stars /><p className="mt-2 text-xs text-muted-foreground">Gebaseerd op 12 reviews</p><p className="mt-2 text-xs font-semibold">★ Trustpilot</p></div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{reviews.map((r,i)=><article key={i} className="min-w-0"><Stars /><h3 className="mt-3 text-sm font-bold">{r.title}</h3><p className="mt-2 text-xs leading-relaxed">{r.text}</p><p className="mt-3 text-xs text-muted-foreground">{r.name}</p></article>)}</div>
  </div></section>;
}
export function Stars() { return <span aria-label="5 sterren" className="mt-1 flex gap-0.5">{Array.from({length:5},(_,i)=><span key={i} className="grid size-4 place-items-center bg-review text-primary-foreground"><Star className="size-3 fill-current" /></span>)}</span>; }