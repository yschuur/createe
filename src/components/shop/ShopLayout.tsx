import { Link } from "@tanstack/react-router";
import { ShoppingBag, Minus, Plus, X, Menu, UserRound, Truck, PackageCheck, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useCart } from "@/lib/cart";
import { formatPrice } from "@/lib/shop";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Reviews } from "@/components/shop/Reviews";

const nav = [
  { to: "/", label: "Home" },
  { to: "/collections/$slug", params: { slug: "golf" }, label: "Golf" },
  { to: "/collections/$slug", params: { slug: "padel" }, label: "Padel" },
  { to: "/design-studio", label: "Studio" },
  { to: "/pages/ons-verhaal", label: "Over ons" },
] as const;

export function ShopLayout({ children }: { children: ReactNode }) {
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="storefront flex min-h-screen flex-col bg-background text-foreground">
      <div className="overflow-hidden bg-primary py-1.5 text-[10px] font-medium uppercase text-primary-foreground">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12">
              <Link to="/design-studio">Ontdek onze Design Studio</Link><span>Shop exclusieve designs</span><span>Gratis verzending vanaf €75</span>
              <Link to="/pages/de-hybr-polo">Ervaar de signature HYBR™ polo</Link>
            </div>
          ))}
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="relative mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu openen" onClick={() => setMenuOpen(true)}><Menu /></Button>
          <nav aria-label="Hoofdmenu" className="hidden min-w-0 gap-4 text-xs font-medium uppercase md:flex lg:gap-5">
            {nav.map((n) => (
              <Link key={n.label} {...n} className="py-3 hover:text-primary" activeProps={{ className: "text-primary underline underline-offset-8" }} activeOptions={{ exact: true }}>
                {n.label}
              </Link>
            ))}
          </nav>
          <Link to="/" className="shrink-0" aria-label="CREATEE home">
            <Logo variant="green" />
          </Link>
          <div className="flex shrink-0 items-center justify-end gap-1 md:gap-3">
            <span className="hidden text-xs sm:block">NL · EUR €</span>
            <Button asChild variant="ghost" size="icon" aria-label="Mijn account"><Link to="/auth"><UserRound /></Link></Button>
            <Button variant="ghost" size="icon" onClick={() => cart.setOpen(true)} className="relative" aria-label="Winkelmand">
              <ShoppingBag className="h-5 w-5" />
              {cart.count > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">{cart.count}</span>
              )}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Reviews />
      <div className="grid gap-4 border-y border-border bg-muted/30 px-4 py-5 text-center text-xs sm:grid-cols-3">
        <span className="flex items-center justify-center gap-2"><Truck className="size-4" />Handmatig en met zorg verzonden</span>
        <span className="flex items-center justify-center gap-2"><PackageCheck className="size-4" />Gratis verzending vanaf €75</span>
        <span className="flex items-center justify-center gap-2"><RefreshCw className="size-4" />Exclusieve designs · premium kleding</span>
      </div>
      <footer className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr] md:px-8">
          <div className="space-y-4">
            <Logo variant="white" className="h-7 md:h-8" />
            <p className="max-w-sm text-sm leading-relaxed opacity-80">Tradities zijn er om te eren, niet om te dragen. Wij geloven dat sportkleding meer mag zijn dan standaard. CREATEE combineert de luxe van een premium fit met het lef van unieke designs.</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="mb-4 text-xs font-bold uppercase">Ontdek</p>
            {nav.map(n => <Link key={n.label} {...n} className="block opacity-80 hover:opacity-100">{n.label}</Link>)}
            <Link to="/pages/de-hybr-polo" className="block opacity-80 hover:opacity-100">De HYBR™ polo</Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="mb-4 text-xs font-bold uppercase">CREATEE</p>
            <Link to="/design-studio" className="block opacity-80 hover:opacity-100">Design Studio</Link>
            <Link to="/collections/$slug" params={{ slug: "polos" }} className="block opacity-80 hover:opacity-100">Polo's</Link>
            <Link to="/collections/$slug" params={{ slug: "t-shirts" }} className="block opacity-80 hover:opacity-100">T-shirts</Link>
          </div>
        </div>
        <div className="border-t border-primary-foreground/20 py-4 text-center text-xs opacity-70">© {new Date().getFullYear()} CREATEE</div>
      </footer>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="storefront w-[min(88vw,360px)] bg-background px-6">
          <SheetHeader><SheetTitle><Logo variant="green" className="h-7" /></SheetTitle></SheetHeader>
          <nav aria-label="Mobiel menu" className="mt-8 flex flex-col">
            {nav.map(n => <Link key={n.label} {...n} onClick={() => setMenuOpen(false)} className="border-b border-border py-5 text-lg font-semibold uppercase" activeProps={{ className: "text-primary" }} activeOptions={{ exact: true }}>{n.label}</Link>)}
            <Link to="/pages/de-hybr-polo" onClick={() => setMenuOpen(false)} className="py-5 text-sm">De HYBR™ polo</Link>
          </nav>
        </SheetContent>
      </Sheet>
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
