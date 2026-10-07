import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/design-studio")({
  head: () => ({
    meta: [
      { title: "CREATEE Design Studio — eigen design voor je groep" },
      { name: "description", content: "Drie unieke designvoorstellen, twee feedbackrondes en premium bedrukking voor je flight, club of event." },
      { property: "og:title", content: "CREATEE Design Studio" },
      { property: "og:description", content: "Eigen design voor je flight, club of event." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DesignStudio,
});

const schema = z.object({
  name: z.string().trim().min(1, "Vul je naam in").max(100),
  email: z.string().trim().email("Ongeldig e-mailadres").max(255),
  phone: z.string().trim().max(30).optional(),
  occasion: z.string().trim().max(200).optional(),
  quantity: z.coerce.number().int().min(1).max(10000).optional(),
  message: z.string().trim().min(1, "Vertel iets over je idee").max(3000),
});

function DesignStudio() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const clean = Object.fromEntries(Object.entries(fd).filter(([, v]) => v !== ""));
    const parsed = schema.safeParse(clean);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setBusy(true);
    const { error } = await supabase.from("design_requests").insert(parsed.data as never);
    setBusy(false);
    if (error) return toast.error("Versturen mislukt, probeer opnieuw.");
    setSent(true);
  }

  return (
    <ShopLayout>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center md:py-24">
          <Logo variant="favicon" className="mx-auto mb-6 h-16" />
          <h1 className="text-5xl font-extrabold md:text-7xl">Design Studio</h1>
          <p className="mx-auto mt-4 max-w-xl opacity-85">Een eigen design voor je flight, club, vrijgezellen of bedrijfsuitje — uitgewerkt door onze designers.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 md:grid-cols-2 md:px-8">
        <div className="space-y-5">
          <h2 className="text-3xl font-extrabold">Zo werkt het</h2>
          <ol className="space-y-4">
            {["Drie unieke, professioneel uitgewerkte designvoorstellen.", "Twee feedbackrondes om het gekozen ontwerp te perfectioneren.", "Hoogwaardige bedrukking op onze premium kleding.", "Een eindproduct dat perfect past bij de gelegenheid en jouw groep."].map((t, i) => (
              <li key={i} className="flex gap-4"><span className="font-display text-3xl text-accent">{i + 1}</span><span className="pt-2">{t}</span></li>
            ))}
          </ol>
          <p className="rounded-sm bg-card p-4 text-sm">Voor deze persoonlijke service vragen we een eenmalige vergoeding van <strong>€50</strong>. Bestel je met het gekozen design? Dan ontvang je <strong>€25</strong> terug als kortingsvoucher op je volgende bestelling.</p>
        </div>
        {sent ? (
          <div className="flex flex-col items-center justify-center rounded-sm bg-card p-10 text-center">
            <h3 className="text-3xl font-extrabold">Bedankt!</h3>
            <p className="mt-2 text-muted-foreground">We nemen zo snel mogelijk contact met je op.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4 rounded-sm bg-card p-6">
            <h3 className="text-2xl font-extrabold">Vraag je design aan</h3>
            <div><Label htmlFor="name">Naam</Label><Input id="name" name="name" required maxLength={100} /></div>
            <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required maxLength={255} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor="phone">Telefoon</Label><Input id="phone" name="phone" maxLength={30} /></div>
              <div><Label htmlFor="quantity">Aantal stuks</Label><Input id="quantity" name="quantity" type="number" min={1} /></div>
            </div>
            <div><Label htmlFor="occasion">Gelegenheid</Label><Input id="occasion" name="occasion" maxLength={200} placeholder="Bijv. golfweekend, clubkampioenschap" /></div>
            <div><Label htmlFor="message">Je idee</Label><Textarea id="message" name="message" required maxLength={3000} rows={5} /></div>
            <Button type="submit" size="lg" className="w-full" disabled={busy}>{busy ? "Versturen…" : "Aanvraag versturen"}</Button>
          </form>
        )}
      </section>
    </ShopLayout>
  );
}
