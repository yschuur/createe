import { Link } from "@tanstack/react-router";
import { ShoppingBag, Minus, Plus, X, Menu, UserRound, Truck, PackageCheck, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { useCart } from "@/lib/cart";
import { formatPrice, sanitizeDescription } from "@/lib/shop";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { checkDiscount } from "@/lib/checkout.functions";
import { discountAmount } from "@/lib/discounts";
import { NewsletterForm } from "@/components/shop/NewsletterForm";
import { Reviews } from "@/components/shop/Reviews";
import { useQuery } from "@tanstack/react-query";
import { homepageQuery, defaultHomepage } from "@/lib/site-settings";
import { menuQuery, defaultMenu } from "@/lib/menu";
import { sectionStylesQuery, buildCss } from "@/lib/section-styles";
import { DesktopMenu, MobileMenu } from "@/components/shop/SiteMenu";
import { buildPageCss, makePageView, pageSettingsQuery, type PageKey } from "@/lib/page-settings";
import { POLICY_SLUGS, policiesQuery, defaultPolicies } from "@/lib/policies";

export function ShopLayout({ children, page, cms }: { children: ReactNode; page?: "home" | "studio" | "story"; cms?: PageKey }) {
  const policies = useQuery(policiesQuery()).data ?? defaultPolicies;
  const cart = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const { data: home } = useQuery(homepageQuery());
  const { data: menu } = useQuery(menuQuery());
  const menuItems = menu ?? defaultMenu;
  const { data: sectionStyles } = useQuery(sectionStylesQuery());
  const pageKey: PageKey | undefined = cms ?? (page === "home" ? "home" : page === "studio" ? "studio" : undefined);
  const { data: globalCfg } = useQuery(pageSettingsQuery("global"));
  const { data: pageCfg } = useQuery({ ...pageSettingsQuery(pageKey ?? "global"), enabled: !!pageKey });
  const g = makePageView("global", globalCfg);
  const customCss = [sectionStyles ? buildCss(sectionStyles) : "", buildPageCss("global", globalCfg), pageKey ? buildPageCss(pageKey, pageCfg) : ""].filter(Boolean).join("\n");
  const usps = [Truck, PackageCheck, RefreshCw].map((Icon, i) => ({ Icon, text: g.t("site-usps", `u${i + 1}_text`), link: g.t("site-usps", `u${i + 1}_link`), show: g.t("site-usps", `u${i + 1}_show`) !== "no" })).filter((u) => u.show && u.text.trim());
  const items = (home ?? defaultHomepage).announcements.filter(a => a.text.trim());
  return (
    <div className={`storefront ${page ? `page-${page}` : ""} flex min-h-screen flex-col bg-background text-foreground`}>
      <style suppressHydrationWarning dangerouslySetInnerHTML={{ __html: customCss }} />
      {items.length > 0 && <div data-section="site-announcement" className="overflow-hidden bg-primary py-1.5 text-[10px] font-medium uppercase text-primary-foreground">
        <div className="animate-marquee flex w-max gap-12 whitespace-nowrap">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="flex gap-12" aria-hidden={k === 1}>
              {[...items, ...items].map((a, i) => a.link ? <a key={i} href={a.link}>{a.text}</a> : <span key={i}>{a.text}</span>)}
            </div>
          ))}
        </div>
      </div>}
      <header data-section="site-header" className="sticky top-0 z-40 border-b-2 border-border bg-background/90 backdrop-blur">
        <div className="relative mx-auto grid h-16 max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 md:h-24 md:px-6">
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu openen" onClick={() => setMenuOpen(true)}><Menu /></Button>
          <nav aria-label="Hoofdmenu" className="hidden md:block"><DesktopMenu items={menuItems} /></nav>
          <Link to="/" className="shrink-0" aria-label="CREATEE home">
            <Logo variant={g.t("site-header", "logo") === "white" ? "white" : "green"} className="md:h-10" />
          </Link>
          <div className="flex shrink-0 items-center justify-end gap-1 md:gap-3">
            <span className="hidden font-label text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:block">NL · EUR €</span>
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
      <div className="border-t border-border bg-muted/40">
        <Reviews />
        {usps.length > 0 && <div data-section="site-usps" className={`grid divide-y divide-border border-t border-border bg-background text-[15px] text-primary sm:divide-x sm:divide-y-0 ${usps.length === 3 ? "sm:grid-cols-3" : usps.length === 2 ? "sm:grid-cols-2" : ""}`}>
          {usps.map(({ Icon, text, link }) => { const inner = <><Icon className="size-5" strokeWidth={1.5} /><span>{text}</span></>; return link ? <a key={text} href={link} className="flex items-center justify-center gap-3 py-5">{inner}</a> : <p key={text} className="flex items-center justify-center gap-3 py-5">{inner}</p>; })}
        </div>}
      </div>
      <footer data-section="site-footer" className="bg-primary text-primary-foreground">
        <div className="grid w-full gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr] md:px-10 xl:px-16">
          <div className="space-y-4">
            <Logo variant={g.t("site-footer", "logo") === "green" ? "green" : "white"} className="h-7 md:h-8" />
            <p data-role="body" className="max-w-sm text-sm leading-relaxed opacity-80">{g.t("site-footer", "about")}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p data-role="heading" className="mb-4 text-xs font-bold uppercase">{g.t("site-footer", "h_discover")}</p>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ label: g.t("site-footer", `d${n}_label`), url: g.t("site-footer", `d${n}_url`) })).filter((l) => l.label.trim()).map((l) => <a key={l.label} href={l.url || "#"} data-role="link" className="block opacity-80 hover:opacity-100">{l.label}</a>)}
          </div>
          <div className="space-y-2 text-sm">
            <p data-role="heading" className="mb-4 text-xs font-bold uppercase">{g.t("site-footer", "h_info")}</p>
            {g.t("site-footer", "info1") && <span data-role="body" className="block opacity-80">{g.t("site-footer", "info1")}</span>}
            {g.t("site-footer", "info2") && <span data-role="body" className="block opacity-80">{g.t("site-footer", "info2")}</span>}
            {g.t("site-footer", "info3_label") && <a href={g.t("site-footer", "info3_url")} target="_blank" rel="noreferrer" data-role="link" className="block opacity-80 hover:opacity-100">{g.t("site-footer", "info3_label")}</a>}
            {POLICY_SLUGS.map(s => <Link key={s} to="/policies/$slug" params={{ slug: s }} data-role="link" className="block opacity-80 hover:opacity-100">{policies[s].label}</Link>)}
          </div>
          <div className="space-y-3 text-sm">
            <p data-role="heading" className="text-xs font-bold uppercase">{g.t("site-footer", "club_title")}</p>
            <div data-role="body" className="leading-relaxed opacity-80 [&_p]:m-0" dangerouslySetInnerHTML={{ __html: sanitizeDescription(g.t("site-footer", "club_text")) }} />
            {g.t("site-footer", "club_show") !== "no" && <NewsletterForm placeholder={g.t("site-footer", "club_placeholder")} button={g.t("site-footer", "club_button")} success={g.t("site-footer", "club_success")} />}
          </div>
        </div>
        <div data-role="body" className="border-t border-primary-foreground/20 py-4 text-center text-xs opacity-70">© {new Date().getFullYear()} {g.t("site-footer", "copyright")}</div>
      </footer>
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="storefront w-[min(88vw,360px)] bg-background px-6">
          <SheetHeader><SheetTitle><Logo variant="green" className="h-7" /></SheetTitle></SheetHeader>
          <nav aria-label="Mobiel menu" className="mt-6"><MobileMenu items={menuItems} onNavigate={() => setMenuOpen(false)} /></nav>
        </SheetContent>
      </Sheet>
      <CartSheet />
    </div>
  );
}

function CartSheet() {
  const cart = useCart();
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const off = cart.discount ? discountAmount(cart.discount, cart.subtotal) : 0;
  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    const r = await checkDiscount({ data: { code: code.trim(), subtotal: cart.subtotal } });
    setBusy(false);
    if (r.ok) { cart.setDiscount({ code: r.code, type: r.type, value: r.value, label: r.label }); setCode(""); setMsg(""); }
    else setMsg(r.error);
  }
  return (
    <Sheet open={cart.open} onOpenChange={cart.setOpen}>
      <SheetContent className="storefront flex w-full flex-col bg-background sm:max-w-md">
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
            {cart.discount ? (
              <div className="flex items-center justify-between text-sm text-primary">
                <span>{cart.discount.code} · {cart.discount.label} <button className="ml-1 underline" onClick={() => cart.setDiscount(null)}>verwijderen</button></span>
                {off > 0 && <span>−{formatPrice(off)}</span>}
              </div>
            ) : (
              <form onSubmit={apply} className="flex gap-2">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Actiecode" aria-label="Actiecode" className="h-9 uppercase" />
                <Button type="submit" variant="outline" size="sm" disabled={busy || !code.trim()}>Toepassen</Button>
              </form>
            )}
            {msg && <p className="text-xs text-destructive">{msg}</p>}
            <div className="flex justify-between font-medium"><span>Subtotaal</span><span>{formatPrice(cart.subtotal - off)}</span></div>
            <Button asChild data-page-button="checkout" className="w-full" size="lg" onClick={() => cart.setOpen(false)}>
              <Link to="/checkout">Afrekenen</Link>
            </Button>
            <p className="text-center text-xs text-muted-foreground">Veilig betalen met iDEAL, Bancontact of creditcard.</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
