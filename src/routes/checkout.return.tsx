import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { useCart } from "@/lib/cart";
import { Logo } from "@/components/Logo";
import { PaymentTestModeBanner } from "@/components/shop/PaymentTestModeBanner";
import { getCheckoutStatus } from "@/lib/checkout.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string | undefined } => ({
    session_id: typeof search['session_id'] === "string" ? search['session_id'] : undefined,
  }),
  head: () => ({ meta: [{ title: "Bedankt voor je bestelling | CREATEE" }, { name: "description", content: "Bedankt voor je bestelling bij CREATEE." }, { property: "og:title", content: "Bedankt voor je bestelling | CREATEE" }, { property: "og:description", content: "Bedankt voor je bestelling bij CREATEE." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: CheckoutReturnRoute,
});

function CheckoutReturnRoute() {
  return (
    <div className="storefront min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/90 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link to="/" aria-label="CREATEE home"><Logo variant="green" className="h-7" /></Link>
          <Link to="/" className="font-label text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground">← Naar de winkel</Link>
        </div>
      </header>
      <PaymentTestModeBanner />
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <ClientReturn />
      </main>
    </div>
  );
}

function ClientReturn() {
  const sessionId = Route.useSearch()['session_id'];
  const cart = useCart();
  const [state, setState] = useState<{ loading: boolean; paid: boolean; orderNumber: string | null; email: string | null }>({ loading: true, paid: false, orderNumber: null, email: null });

  useEffect(() => {
    cart.clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionId) { setState({ loading: false, paid: false, orderNumber: null, email: null }); return; }
    let cancelled = false;
    (async () => {
      const res = await getCheckoutStatus({ data: { sessionId, environment: getStripeEnvironment() } });
      if (cancelled) return;
      if ("error" in res) setState({ loading: false, paid: false, orderNumber: null, email: null });
      else setState({ loading: false, paid: res.status === "paid" || res.status === "no_payment_required", orderNumber: res.orderNumber, email: res.email });
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  return (
    <div className="text-center">
      {state.paid ? (
        <CheckCircle2 className="mx-auto size-14 text-primary" strokeWidth={1.5} />
      ) : (
        <Clock className="mx-auto size-14 text-muted-foreground" strokeWidth={1.5} />
      )}
      <h1 className="mt-6 font-display text-3xl font-bold">
        {state.loading ? "Even geduld…" : state.paid ? "Bedankt voor je bestelling!" : "Je betaling wordt verwerkt"}
      </h1>
      {state.orderNumber && <p className="mt-3 text-sm text-muted-foreground">Bestelnummer: <span className="font-mono font-medium text-foreground">{state.orderNumber}</span></p>}
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {state.paid
          ? "We gaan aan de slag met je bestelling. Je ontvangt een bevestiging per e-mail zodra deze wordt verzonden."
          : "Zodra je betaling is afgerond, versturen we je bestelling. Dit kan enkele minuten duren."}
      </p>
      <p className="mt-8"><Link to="/" className="inline-block rounded-md bg-primary px-6 py-3 font-label text-sm font-semibold uppercase tracking-wide text-primary-foreground hover:bg-primary/90">Verder winkelen</Link></p>
    </div>
  );
}
