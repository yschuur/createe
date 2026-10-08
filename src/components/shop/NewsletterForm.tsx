import { useState } from "react";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
import { sanitizeDescription } from "@/lib/shop";
import { Button } from "@/components/ui/button";

export function NewsletterForm({ placeholder, button, success }: { placeholder: string; button: string; success: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ code: string | null } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const r = await subscribeNewsletter({ data: { email } });
      if (r.ok) setDone({ code: r.code }); else setError(r.error);
    } catch { setError("Vul een geldig e-mailadres in."); }
    setBusy(false);
  }

  if (done) return (
    <div className="space-y-2">
      <div data-role="body" className="leading-relaxed [&_p]:m-0" dangerouslySetInnerHTML={{ __html: sanitizeDescription(success) }} />
      {done.code && <p className="inline-block select-all border border-dashed border-current px-3 py-1.5 font-mono text-base font-semibold tracking-widest">{done.code}</p>}
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={placeholder} aria-label={placeholder}
          className="h-10 min-w-0 flex-1 border border-current/40 bg-transparent px-3 text-sm placeholder:text-current placeholder:opacity-60 focus:outline-none" />
        <Button type="submit" data-page-button="subscribe" disabled={busy}
          className="min-h-10 h-auto whitespace-normal bg-primary-foreground px-4 font-label text-xs font-semibold uppercase text-primary hover:bg-primary-foreground/90">{button}</Button>
      </div>
      {error && <p className="text-xs">{error}</p>}
    </form>
  );
}
