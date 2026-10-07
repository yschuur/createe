import { Link } from "@tanstack/react-router";
import { ShoppingBag, Minus, Plus, X } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/shop";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/collections/$slug", params: { slug: "golf" }, label: "Golf" },
  { to: "/collections/$slug", params: { slug: "padel" }, label: "Padel" },
  { to: "/collections/$slug", params: { slug: "nieuw" }, label: "Nieuw" },
  { to: "/collections/$slug", params: { slug: "sale" }, label: "Sale" },
] as const;

export function ShopLayout({ children }: { children: ReactNode }) {
  const cart = useCart();
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="overflow-hidden bg-primary py-2 text-xs uppercase tracking-[0.2em] text-primary-foreground">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12">
              <span>Organisch katoen</span><span>⛳ Ontworpen in Nederland</span><span>Gratis verzending vanaf €75</span>
              <span>🎾 Golf & padel met een knipoog</span><span>Kleine oplages</span><span>⛳ Ontworpen in Nederland</span>
            </div>
          ))}
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
          <nav className="hidden gap-6 text-sm font-medium md:flex">
            {nav.map((n) => (
              <Link key={n.label} to={n.to} params={n.params} className="hover:text-primary" activeProps={{ className: "text-primary underline underline-offset-8" }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link to="/" className="md:absolute md:left-1/2 md:-translate-x-1/2" aria-label="CREATEE home">
            <Logo variant="green" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/design-studio" className="hidden text-sm font-medium hover:text-primary md:block">Design Studio</Link>
            <button onClick={() => cart.setOpen(true)} className="relative p-2" aria-label="Winkelmand">
              <ShoppingBag className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{cart.count}</span>
              )}
            </button>
          </div>
        </div>
        <nav className="flex gap-5 overflow-x-auto border-t border-border px-4 py-2 text-sm md:hidden">
          {nav.map((n) => (<Link key={n.label} to={n.to} params={n.params}>{n.label}</Link>))}
          <Link to="/design-studio">Design Studio</Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-8">
          <div className="space-y-4">
            <Logo variant="white" className="h-7 md:h-8" />
            <p className="max-w-xs text-sm opacity-80">Kleding voor de baan, de court en de 19e hole. Met een knipoog ontworpen.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-display text-lg">Shop</p>
            <Link to="/collections/$slug" params={{ slug: "polos" }} className="block opacity-80 hover:opacity-100">Polo's</Link>
            <Link to="/collections/$slug" params={{ slug: "t-shirts" }} className="block opacity-80 hover:opacity-100">T-shirts</Link>
            <Link to="/collections/$slug" params={{ slug: "padel" }} className="block opacity-80 hover:opacity-100">Padel</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-display text-lg">CREATEE</p>
            <Link to="/design-studio" className="block opacity-80 hover:opacity-100">Design Studio</Link>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 py-4 text-center text-xs opacity-70">© {new Date().getFullYear()} CREATEE</div>
      </footer>
      <CartSheet />
    </div>
  );
}

function CartSheet() {
  const cart = useCart();
  return (
    <Sheet open={cart.open} onOpenChange={cart.setOpen}>
      <SheetContent className="flex w-full flex-col bg-background sm:max-w-md">
        <SheetHeader><SheetTitle className="font-display text-2xl">Winkelmand</SheetTitle></SheetHeader>
        {cart.items.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground">Je winkelmand is nog leeg.</p>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto">
            {cart.items.map((i) => (
              <div key={i.variantId} className="flex gap-3 border-b border-border pb-4">
                {i.image && <img src={i.image} alt={i.name} className="h-20 w-16 rounded-sm bg-muted object-cover" />}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{i.name}</p>
                    <button onClick={() => cart.remove(i.variantId)} aria-label="Verwijderen"><X className="h-4 w-4" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground">{i.variantLabel}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-sm border border-border">
                      <button className="p-1.5" onClick={() => cart.update(i.variantId, i.quantity - 1)} aria-label="Minder"><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-sm">{i.quantity}</span>
                      <button className="p-1.5" onClick={() => cart.update(i.variantId, i.quantity + 1)} aria-label="Meer"><Plus className="h-3 w-3" /></button>
                    </div>
                    <span className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {cart.items.length > 0 && (
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex justify-between font-medium"><span>Subtotaal</span><span>{formatPrice(cart.subtotal)}</span></div>
            <Button className="w-full" size="lg" disabled>Afrekenen (binnenkort)</Button>
            <p className="text-center text-xs text-muted-foreground">Online betalen wordt binnenkort gekoppeld.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
