import { Star } from "lucide-react";
import { reviews, trustpilot } from "@/lib/reviews-data";

export function Reviews() {
  return <section aria-label="Klantbeoordelingen" className="border-y border-border bg-muted/25 px-5 py-10">
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><p className="text-lg font-bold">Uitstekend</p><Stars /><p className="mt-2 text-xs text-muted-foreground">Gebaseerd op {trustpilot.total} reviews op Trustpilot</p></div>
        <a href={trustpilot.link} target="_blank" rel="noreferrer" className="text-xs font-semibold underline underline-offset-4">Bekijk alle reviews</a>
      </div>
      <div className="flex snap-x gap-5 overflow-x-auto pb-3 [scrollbar-width:thin]">
        {reviews.map((r, i) => <article key={i} className="w-[78vw] max-w-[300px] shrink-0 snap-start border border-border bg-background p-5">
          <Stars />
          <h3 className="mt-3 text-sm font-bold">{r.title}</h3>
          <p className="mt-2 line-clamp-6 whitespace-pre-line text-xs leading-relaxed">{r.text}</p>
          <p className="mt-3 text-xs text-muted-foreground">{r.author} · {r.date}</p>
        </article>)}
      </div>
    </div>
  </section>;
}
export function Stars() { return <span aria-label="5 sterren" className="mt-1 flex gap-0.5">{Array.from({length:5},(_,i)=><span key={i} className="grid size-4 place-items-center bg-review text-primary-foreground"><Star className="size-3 fill-current" /></span>)}</span>; }
