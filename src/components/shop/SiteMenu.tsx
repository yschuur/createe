import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { MenuItem } from "@/lib/menu";

function ItemLink({ item, className, onClick }: { item: MenuItem; className?: string; onClick?: () => void }) {
  return item.link
    ? <a href={item.link} className={className} onClick={onClick}>{item.label}</a>
    : <span className={className}>{item.label}</span>;
}

function Flyout({ items, nested }: { items: MenuItem[]; nested?: boolean }) {
  return <ul className={`invisible absolute z-50 min-w-56 border border-border bg-background py-4 normal-case tracking-normal opacity-0 shadow-2xl ring-1 ring-foreground/5 transition-all duration-200 group-hover/m:visible group-hover/m:opacity-100 group-focus-within/m:visible group-focus-within/m:opacity-100 ${nested ? "left-full top-0 -mt-4" : "left-0 top-full pt-0"}`}>
    {items.map((c, i) => <li key={i} className="group/m relative">
      <div className="flex items-center justify-between gap-4 px-6 py-2.5 font-label text-sm font-medium hover:bg-muted hover:text-primary">
        <ItemLink item={c} />{c.children.length > 0 && <ChevronRight className="size-3.5" />}
      </div>
      {c.children.length > 0 && <Flyout items={c.children} nested />}
    </li>)}
  </ul>;
}

export function DesktopMenu({ items }: { items: MenuItem[] }) {
  return <ul className="flex min-w-0 gap-8 font-display text-sm font-bold uppercase tracking-[0.22em] lg:gap-10">
    {items.map((it, i) => <li key={i} className="group/m relative">
      <div className="flex items-center gap-1.5 border-b-2 border-transparent py-6 transition-colors hover:border-primary hover:text-primary">
        <ItemLink item={it} />{it.children.length > 0 && <ChevronDown className="size-3 transition-transform group-hover/m:rotate-180" aria-hidden />}
      </div>
      {it.children.length > 0 && <Flyout items={it.children} />}
    </li>)}
  </ul>;
}

function MobileItem({ item, depth, onNavigate }: { item: MenuItem; depth: number; onNavigate: () => void }) {
  const [open, setOpen] = useState(false);
  const has = item.children.length > 0;
  return <li className={depth === 0 ? "border-b border-border" : ""}>
    <div className="flex items-center justify-between" style={{ paddingLeft: depth * 16 }}>
      <ItemLink item={item} onClick={onNavigate} className={depth === 0 ? "flex-1 py-4 text-lg font-semibold uppercase" : "flex-1 py-3 text-sm"} />
      {has && <button type="button" aria-expanded={open} aria-label={`${item.label} submenu`} onClick={() => setOpen(!open)} className="p-3"><ChevronDown className={`size-4 transition ${open ? "rotate-180" : ""}`} /></button>}
    </div>
    {has && open && <ul className="pb-2">{item.children.map((c, i) => <MobileItem key={i} item={c} depth={depth + 1} onNavigate={onNavigate} />)}</ul>}
  </li>;
}

export function MobileMenu({ items, onNavigate }: { items: MenuItem[]; onNavigate: () => void }) {
  return <ul className="flex flex-col">{items.map((it, i) => <MobileItem key={i} item={it} depth={0} onNavigate={onNavigate} />)}</ul>;
}
