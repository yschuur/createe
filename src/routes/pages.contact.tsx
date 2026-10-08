import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { UserRound, Mail, Phone, Hash, MessageSquare, Send, LockKeyhole, CircleHelp, ShoppingBag, Truck, RefreshCw, Palette, ChevronDown } from "lucide-react";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { PageText } from "@/components/shop/PageText";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactFaqQuery } from "@/lib/contact";
import { contactSubmissionSchema, faqInitiallyExpanded } from "@/lib/contact-schema";
import { submitContact } from "@/lib/contact.functions";
import { pageSettingsQuery, usePageSettings } from "@/lib/page-settings";

export const Route = createFileRoute("/pages/contact")({
  head: () => ({ meta: [
    { title: "Contact & veelgestelde vragen — CREATEE" },
    { name: "description", content: "Neem contact op met CREATEE en vind antwoorden over bestellingen, verzending, retouren en de Design Studio." },
    { property: "og:title", content: "Contact & veelgestelde vragen — CREATEE" },
    { property: "og:description", content: "Een vraag over je bestelling of een persoonlijk design? Neem contact op met CREATEE." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(contactFaqQuery()), context.queryClient.ensureQueryData(pageSettingsQuery("contact")), context.queryClient.ensureQueryData(pageSettingsQuery("global"))]),
  component: ContactPage,
});

const categoryIcons = { general: CircleHelp, orders: ShoppingBag, shipping: Truck, returns: RefreshCw, studio: Palette };

function FaqItem({ question, answer, id }: { question: string; answer: string; id: string }) {
  const [open, setOpen] = useState(faqInitiallyExpanded);
  return <div className="contact-faq-item">
    <Button variant="ghost" className="contact-faq-toggle" data-page-button="faq-toggle" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
      <PageText as="span" inline value={question} /><ChevronDown className={`size-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
    </Button>
    <div id={id} hidden={!open}><PageText value={answer} className="contact-faq-answer" /></div>
  </div>;
}

function ContactPage() {
  const { data: faq } = useSuspenseQuery(contactFaqQuery());
  const { t } = usePageSettings("contact");
  const submit = useServerFn(submitContact);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  async function send(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = contactSubmissionSchema.safeParse(Object.fromEntries(new FormData(form)));
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Controleer je gegevens."); return; }
    setBusy(true); setError("");
    try {
      const result = await submit({ data: parsed.data });
      if (!result.ok) { setError(result.error); return; }
      setSent(true); form.reset();
    } catch { setError("Versturen is niet gelukt. Probeer het opnieuw."); }
    finally { setBusy(false); }
  }
  const fields = [
    { name: "name", key: "name", Icon: UserRound, required: true, max: 100, type: "text", auto: "name" },
    { name: "email", key: "email", Icon: Mail, required: true, max: 255, type: "email", auto: "email" },
    { name: "phone", key: "phone", Icon: Phone, required: false, max: 40, type: "tel", auto: "tel" },
    { name: "order_number", key: "order", Icon: Hash, required: false, max: 100, type: "text", auto: "off" },
  ];
  return <ShopLayout cms="contact">
    <h1 className="sr-only">Contact</h1>
    <div className="contact-grid">
      <section data-section="contact-form" className="contact-column">
        <PageText value={t("contact-form", "intro")} className="contact-intro" />
        <form className="contact-form" onSubmit={send}>
          <PageText value={t("contact-form", "description")} className="contact-description" />
          {sent ? <div role="status" className="py-8 text-center text-primary"><PageText value={t("contact-form", "success")} /><Button variant="outline" type="button" className="mt-6" onClick={() => setSent(false)}>Nog een bericht sturen</Button></div> : <>
            {fields.map(({ name, key, Icon, required, max, type, auto }) => <div key={name} className="contact-field">
              <label htmlFor={`contact-${name}`}><Icon className="size-3" />{t("contact-form", `${key}_label`)}{required && " *"}</label>
              <Input id={`contact-${name}`} name={name} type={type} autoComplete={auto} required={required} maxLength={max} placeholder={t("contact-form", `${key}_placeholder`)} />
            </div>)}
            <div className="contact-field"><label htmlFor="contact-message"><MessageSquare className="size-3" />{t("contact-form", "message_label")} *</label><Textarea id="contact-message" name="message" required maxLength={5000} placeholder={t("contact-form", "message_placeholder")} /></div>
            <div hidden aria-hidden="true"><label htmlFor="contact-website">Website</label><input id="contact-website" name="website" tabIndex={-1} autoComplete="off" /></div>
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <div className="contact-submit"><Button type="submit" disabled={busy} data-page-button="submit">{busy ? "Versturen…" : t("contact-form", "submit_label")}<Send className="size-3" /></Button></div>
            <p className="contact-privacy"><LockKeyhole className="size-2.5" />{t("contact-form", "privacy")}</p>
          </>}
        </form>
      </section>
      <section data-section="contact-faq" className="contact-column">
        <PageText value={t("contact-faq", "intro")} className="contact-intro" />
        <div className="contact-faq-list">{faq.categories.map((category, index) => {
          const Icon = categoryIcons[category.icon];
          return <article key={category.id} className="contact-faq-category"><h2><span className="contact-faq-icon"><Icon className="size-4" /></span><PageText as="span" inline value={category.title} /></h2>
            {category.items.map((item, j) => <FaqItem key={item.id} id={`faq-${index}-${j}`} question={item.question} answer={item.answer} />)}
          </article>;
        })}</div>
      </section>
    </div>
  </ShopLayout>;
}