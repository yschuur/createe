import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/Logo";
import { NewsletterForm } from "@/components/shop/NewsletterForm";
import { sanitizeDescription } from "@/lib/shop";
import { buildPageCss, makePageView, pageSettingsQuery, safeUrl } from "@/lib/page-settings";

export function ShopFooter() {
  const { data } = useQuery(pageSettingsQuery("footer"));
  const footer = makePageView("footer", data);
  const text = (key: string) => footer.t("footer-main", key);
  const links = (prefix: string) => Array.from({ length: 8 }, (_, i) => ({
    label: text(`${prefix}${i + 1}_label`), url: safeUrl(text(`${prefix}${i + 1}_url`)),
  })).filter((link) => link.label.trim() && link.url);
  return <footer data-section="footer-main" className="bg-primary px-6 py-12 text-primary-foreground md:px-10 xl:px-16">
    <style dangerouslySetInnerHTML={{ __html: buildPageCss("footer", footer.config) }} />
    <div className="grid w-full gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1.3fr]">
      <div className="space-y-4">
        <Logo variant={text("logo") === "green" ? "green" : "white"} className="h-7 md:h-8" />
        <p data-role="body" className="max-w-sm text-sm leading-relaxed">{text("about")}</p>
      </div>
      {[{ prefix: "d", title: "h_discover" }, { prefix: "i", title: "h_info" }].map((column) => <div key={column.prefix} className="space-y-3">
        <h2 data-role="heading" className="mb-4 font-label text-xs font-bold uppercase">{text(column.title)}</h2>
        <nav aria-label={text(column.title)} className="space-y-2">
          {links(column.prefix).map((link, i) => <a key={i} href={link.url} data-role="link" className="block text-sm underline-offset-4 hover:underline">{link.label}</a>)}
        </nav>
      </div>)}
      <div className="min-w-0 space-y-3">
        <h2 data-role="heading" className="font-label text-xs font-bold uppercase">{text("club_title")}</h2>
        <div data-role="body" className="text-sm leading-relaxed [&_p]:m-0" dangerouslySetInnerHTML={{ __html: sanitizeDescription(text("club_text")) }} />
        {text("club_show") !== "no" && <NewsletterForm placeholder={text("club_placeholder")} button={text("club_button")} success={text("club_success")} />}
      </div>
    </div>
    <p data-role="body" className="mt-10 border-t border-primary-foreground/20 pt-4 text-center text-xs">© {new Date().getFullYear()} {text("copyright")}</p>
  </footer>;
}