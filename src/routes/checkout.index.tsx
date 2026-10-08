import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { shippingQuery, shippingCost } from "@/lib/shipping";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { useCart } from "@/lib/cart";
import { formatPrice, imgUrl } from "@/lib/shop";
import { Logo } from "@/components/Logo";
import { PaymentTestModeBanner } from "@/components/shop/PaymentTestModeBanner";
import { createCheckoutSession } from "@/lib/checkout.functions";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/checkout/")({
  head: () => ({ meta: [{ title: "Afrekenen — CREATEE" }, { name: "description", content: "Veilig afrekenen bij CREATEE." }, { property: "og:title", content: "Afrekenen — CREATEE" }, { property: "og:description", content: "Veilig afrekenen bij CREATEE." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutRoute,
});

function CheckoutRoute() {
  return (
    <div className="storefront min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" aria-label="CREATEE home"><Logo variant="green" className="h-7" /></Link>
          <Link to="/" className="font-label text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Verder winkelen</Link>
        </div>
      </header>
      <PaymentTestModeBanner />
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <ClientOnly fallback={<p className="py-16 text-center text-muted-foreground">Laden…</p>}>
          <CheckoutContent />
        </ClientOnly>
      </main>
    </div>
  );
}

function CheckoutContent() {
  const cart = useCart();
  const navigate = useNavigate();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const startedRef = useRef(false);
  const { data: ship } = useQuery(shippingQuery());
  const [code, setCode] = useState("");
  const [freeShipping, setFreeShipping] = useState(false);
  const [codeMsg, setCodeMsg] = useState("");

  async function start(discountCode: string | null) {
    setCreating(true);
    setClientSecret(null);
    {
      const { data: { user } } = await supabase.auth.getUser();
      const res = await createCheckoutSession({
        data: {
          items: cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          userId: user?.id ?? null,
          returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
          environment: getStripeEnvironment(),
          discountCode,
        },
      });
      setCreating(false);
      if ("error" in res && res.error) setError(res.error);
      else if ("clientSecret" in res) {
        setClientSecret(res.clientSecret);
        setFreeShipping(res.freeShipping);
        setCodeMsg(res.discountError ?? (res.freeShipping ? "Gratis bezorging toegepast!" : ""));
      }
    }
  }

  useEffect(() => {
    if (startedRef.current) return;
    if (cart.items.length === 0) return;
    startedRef.current = true;
    void start(null);
  }, [cart.items]);

  if (cart.items.length === 0 && !error) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Afrekenen</h1>
        <p className="mt-4 text-muted-foreground">Je winkelmand is leeg.</p>
        <Button asChild className="mt-6"><Link to="/">Naar de winkel</Link></Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-3xl font-bold">Afrekenen</h1>
        <p className="mt-4 text-muted-foreground">{error}</p>
        <Button className="mt-6" onClick={() => { setError(""); startedRef.current = false; navigate({ to: "/checkout", replace: true, reloadDocument: true }); }}>
          Opnieuw proberen
        </Button>
        <p><Link to="/" className="mt-3 inline-block font-label text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Verder winkelen</Link></p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">Afrekenen</h1>
      <div className="rounded-sm border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <p className="font-label text-xs font-semibold uppercase tracking-widest text-muted-foreground">Jouw bestelling</p>
        </div>
        <ul>
          {cart.items.map((i) => (
            <li key={i.variantId} className="flex items-center gap-4 border-b border-border px-5 py-3 last:border-b-0">
              {i.image && <img src={imgUrl(i.image, 120)} alt={i.name} className="h-14 w-11 rounded-sm bg-muted object-cover" />}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.variantLabel}</p>
              </div>
              <span className="text-sm text-muted-foreground">×{i.quantity}</span>
              <span className="text-sm font-medium">{formatPrice(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-border px-5 py-4 font-medium">
          <span>Subtotaal</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>
        {ship && <div className="flex justify-between border-t border-border px-5 py-3 text-sm text-muted-foreground">
          <span>Verzending</span>
          <span>{freeShipping || shippingCost(cart.subtotal, ship) === 0 ? "Gratis" : formatPrice(shippingCost(cart.subtotal, ship))}</span>
        </div>}
        <form className="flex flex-wrap items-center gap-2 border-t border-border px-5 py-3" onSubmit={(e) => { e.preventDefault(); if (code.trim()) void start(code.trim()); }}>
          <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Kortingscode" className="h-9 max-w-xs uppercase" aria-label="Kortingscode" />
          <Button type="submit" variant="outline" size="sm" disabled={creating || !code.trim()}>Toepassen</Button>
          {codeMsg && <span className={`text-sm ${freeShipping ? "text-primary" : "text-destructive"}`}>{codeMsg}</span>}
        </form>
      </div>
      <div className="rounded-sm border border-border bg-card p-4 sm:p-6">
        {creating || !clientSecret ? (
          <p className="py-10 text-center text-muted-foreground">Betaalomgeving starten…</p>
        ) : (
          <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
      </div>
      <p className="text-center text-xs text-muted-foreground">Betaal veilig met iDEAL, Bancontact of creditcard. Prijzen zijn inclusief btw.</p>
    </div>
  );
}
