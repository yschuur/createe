import { useRef, useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { reviews, trustpilot } from "@/lib/reviews-data";

function ReviewText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > 180;
  return <div>
    <p className={`whitespace-pre-line text-[13px] leading-[1.4] opacity-90 ${!open && long ? "line-clamp-3" : ""}`}>{text}</p>
    {long && <button type="button" onClick={() => setOpen(!open)} className="mt-1.5 text-xs font-semibold text-review underline">{open ? "Lees minder" : "Lees meer"}</button>}
  </div>;
}

export function Reviews() {
  const row = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => row.current?.scrollBy({ left: dir * row.current.clientWidth, behavior: "smooth" });
  return <section data-section="site-reviews" aria-label="Klantbeoordelingen" className="px-5 py-5 font-display lg:px-10 lg:py-10">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-10">
      <div className="flex shrink-0 flex-col items-center gap-2 text-center lg:w-40 lg:items-start lg:text-left">
        <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-2">
          <h3 className="text-lg font-semibold lg:text-xl">Uitstekend</h3>
          <Stars size="lg" />
        </div>
        <p className="text-xs opacity-80">Gebaseerd op <a href={trustpilot.link} target="_blank" rel="noreferrer" className="underline hover:text-review">{trustpilot.total} reviews</a></p>
        <a href={trustpilot.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-semibold"><Star className="size-4 fill-review text-review" />Trustpilot</a>
      </div>
      <div className="relative min-w-0 flex-1 px-11">
        <button type="button" aria-label="Vorige reviews" onClick={() => scroll(-1)} className="absolute left-0.5 top-6 grid size-8 place-items-center rounded-full border border-border hover:border-foreground/50"><ChevronLeft className="size-4" /></button>
        <div ref={row} className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reviews.map((r, i) => <article key={i} className="flex w-[calc(100%-10px)] shrink-0 snap-start flex-col md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
            <Stars />
            <p className="mb-2 mt-1.5 text-xs text-muted-foreground">{r.author}, {r.date}</p>
            <h4 className="mb-1.5 text-sm font-bold leading-tight">{r.title}</h4>
            <ReviewText text={r.text} />
          </article>)}
        </div>
        <button type="button" aria-label="Volgende reviews" onClick={() => scroll(1)} className="absolute right-0.5 top-6 grid size-8 place-items-center rounded-full border border-border hover:border-foreground/50"><ChevronRight className="size-4" /></button>
      </div>
    </div>
  </section>;
}

export function Stars({ size = "sm" }: { size?: "sm" | "lg" }) {
  const box = size === "lg" ? "size-5" : "size-4";
  return <span aria-label="5 sterren" className="flex gap-[3px]">{Array.from({ length: 5 }, (_, i) => <span key={i} className={`grid ${box} place-items-center bg-review text-primary-foreground`}><Star className="size-3 fill-current" /></span>)}</span>;
}
