import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { productColor } from "@/lib/product-colors";
import { ShoppingBag, Ruler, ChevronRight, ChevronUp as ChevronUpIcon } from "lucide-react";
import { getPage } from "@/lib/product-page";
import { galleryImages, variantColor } from "@/lib/product-gallery";
import { useCart } from "@/lib/cart";
import {
  formatPrice, imgUrl, isPurchasable, optionLabel, prettyValue, productQuery, sanitizeDescription,
} from "@/lib/shop";

export const Route = createFileRoute("/products/$handle")({
  loader: async ({ context, params }) => {
    if (params.handle === "createe-design-studio") throw redirect({ to: "/design-studio" });
    const p = await context.queryClient.ensureQueryData(productQuery(params.handle));
    if (!p) throw notFound();
    const active = p.product_variants.filter((v) => v.active);
    const prices = active.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
    return {
      name: p.name, seoTitle: p.seo_title, seoDescription: p.seo_description, image: p.product_images[0]?.url ?? null,
      handle: params.handle, price: prices.length ? Math.min(...prices) : null, inStock: active.some(isPurchasable),
    };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.seoTitle || `${loaderData?.name ?? "Product"} — CREATEE`;
    const description = loaderData?.seoDescription || `${loaderData?.name ?? "Product"} van CREATEE.`;
    const meta = [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" },
    ];
    const hasImage = !!loaderData?.image?.startsWith("https://");
    if (hasImage && loaderData?.image) {
      meta.push({ property: "og:image", content: loaderData.image }, { name: "twitter:image", content: loaderData.image } as never);
    }
    const url = `https://createe.nl/products/${loaderData?.handle ?? ""}`;
    const scripts = loaderData ? [{ type: "application/ld+json", children: JSON.stringify({
      "@context": "https://schema.org", "@type": "Product", name: loaderData.name, description,
      ...(hasImage ? { image: [loaderData.image] } : {}),
      brand: { "@type": "Brand", name: "CREATEE" }, url,
      ...(loaderData.price != null ? { offers: {
        "@type": "Offer", priceCurrency: "EUR", price: loaderData.price.toFixed(2), url,
        availability: loaderData.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      } } : {}),
    }) }] : [];
    return { meta, scripts };
  },
  component: ProductPage,
  notFoundComponent: () => <ShopLayout><p className="py-24 text-center">Product niet gevonden.</p></ShopLayout>,
  errorComponent: () => <ShopLayout><p className="py-24 text-center">Product kon niet geladen worden.</p></ShopLayout>,
});

function ProductPage() {
  const { handle } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(handle));
  const cart = useCart();
  const variants = product?.product_variants.filter((v) => v.active) ?? [];
  const optionNames = useMemo(() => {
    const v = variants[0];
    return v ? ([v.option1_name, v.option2_name, v.option3_name] as (string | null)[]) : [];
  }, [variants]);
  const [selected, setSelected] = useState<(string | null)[]>(() => {
    const first = variants.find(isPurchasable) ?? variants[0];
    return first ? [first.option1_value, first.option2_value, first.option3_value] : [];
  });
  void Link;
  if (!product) return null;

  const keys = ["option1_value", "option2_value", "option3_value"] as const;
  const variant = variants.find((v) => keys.every((k, i) => (v[k] ?? null) === (selected[i] ?? null)));
  const images = galleryImages(product, variantColor(variant));

  const choose = (idx: number, value: string) => {
    const next = [...selected];
    next[idx] = value;
    // keep a valid combination
    if (!variants.some((v) => keys.every((k, i) => (v[k] ?? null) === (next[i] ?? null)))) {
       const key = keys[idx];
       if (!key) return;
      const m = variants.find((v) => v[key] === value);
      if (m) keys.forEach((k, i) => (next[i] = m[k]));
    }
    setSelected(next);
  };

  const add = () => {
    if (!variant || !isPurchasable(variant)) return;
    cart.add({
      variantId: variant.id, productSlug: product.slug, name: product.name, variantLabel: optionLabel(variant),
      price: Number(variant.price), image: imgUrl(images[0]?.url, 200), quantity: 1,
      maxQuantity: variant.track_inventory && !variant.allow_backorder ? variant.inventory_quantity : null,
    });
    cart.setOpen(true);
    toast.success(`${product.name} toegevoegd`);
  };

  const hasOptions = optionNames.some(Boolean);
  const compareAt = variant?.compare_at_price && Number(variant.compare_at_price) > Number(variant.price) ? variant.compare_at_price : null;
  const page = getPage(product);
  const isColor = (n: string | null) => !!n && /kleur|color|colour|vanille/i.test(n);

  return (
    <ShopLayout cms="product">
      <div data-section="product-main" className="pdp grid gap-8 md:grid-cols-[1.9fr_1fr] md:gap-10 md:pr-4">
        <div className="flex snap-x snap-mandatory gap-1 overflow-x-auto sm:grid sm:grid-cols-2 sm:overflow-visible">
          {images.length === 0 && <div className="aspect-[3/4] w-full shrink-0 bg-card sm:w-auto" />}
           {images.map((im) => {
             return (
             <div key={im.id} data-role="pdp-image" className="aspect-[3/4] w-full shrink-0 snap-center overflow-hidden bg-card sm:w-auto">
              <img src={imgUrl(im.url, 1000)} alt={im.alt_text ?? product.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
           ); })}
        </div>
        <div className="px-4 pb-10 md:sticky md:top-24 md:self-start md:px-0 md:pt-6">
          <div className="flex items-baseline justify-between gap-4">
            <h1 className="pdp-title min-w-0 text-3xl">{product.name}</h1>
            <div data-role="price" className="text-right text-base">
              <span>{formatPrice(variant?.price ?? variants[0]?.price)}</span>
              {compareAt && <span className="ml-2 text-sm text-muted-foreground line-through">{formatPrice(compareAt)}</span>}
            </div>
          </div>

          {hasOptions && optionNames.map((name, idx) => {
            if (!name) return null;
             const key = keys[idx];
             if (!key) return null;
            const values = Array.from(new Set(variants.map((v) => v[key]).filter(Boolean))) as string[];
            const color = isColor(name);
            return (
              <div key={idx} className="mt-5">
                <p className="mb-2 text-sm"><span className="font-semibold">{name === "Vanille" ? "Kleur" : name}</span>{color && <span className="ml-2 text-muted-foreground">{prettyValue(selected[idx])}</span>}</p>
                <div className={color ? "flex flex-wrap gap-2" : "grid grid-cols-4 gap-2"}>
                  {values.map((val) => {
                    const combo = [...selected]; combo[idx] = val;
                    const v = variants.find((x) => keys.every((k, i) => (x[k] ?? null) === (combo[i] ?? null)));
                    const available = v ? isPurchasable(v) : false;
                    const active = selected[idx] === val;
                    if (color) {
                      return (
                         <Button variant="ghost" size="icon" key={val} onClick={() => choose(idx, val)} title={prettyValue(val)} aria-label={prettyValue(val)} aria-pressed={active}
                           className={`h-7 w-7 overflow-hidden border p-0.5 ${active ? "border-foreground ring-1 ring-foreground ring-offset-2 ring-offset-background" : "border-border"}`}>
                           <span className="block h-full w-full" style={{ background: productColor(val) }} />
                         </Button>
                      );
                    }
                    return (
                      <Button data-page-button="size" variant="outline" key={val} onClick={() => choose(idx, val)}
                        className={`h-10 border text-xs font-semibold transition ${active ? "border-foreground bg-foreground text-background" : "border-border bg-background hover:border-foreground"} ${!available ? "line-through opacity-50" : ""}`}>
                        {prettyValue(val)}
                      </Button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <Button data-page-button="add" onClick={add} disabled={!variant || !isPurchasable(variant)}
            className="font-label mt-4 flex h-11 w-full items-center justify-center gap-2 bg-primary text-sm font-semibold uppercase tracking-wider text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
            <ShoppingBag className="h-4 w-4" />
            {!variant ? "Niet beschikbaar" : isPurchasable(variant) ? page.addToCartLabel : "Uitverkocht"}
          </Button>
          {variant && variant.track_inventory && variant.inventory_quantity > 0 && variant.inventory_quantity <= 2 && (
            <p className="mt-2 text-center text-sm text-muted-foreground">Nog maar {variant.inventory_quantity} op voorraad</p>
          )}

          <div className="mt-4 flex items-center justify-between gap-4 border-b border-border pb-4">
            <dl className="font-label min-w-0 space-y-1 text-[11px] uppercase tracking-wide">
              {page.fitValue && <div><dt className="inline font-bold">{page.fitLabel}</dt> <dd className="inline text-muted-foreground">{page.fitValue}</dd></div>}
              {page.modelValue && <div><dt className="inline font-bold">{page.modelLabel}</dt> <dd className="inline text-muted-foreground">{page.modelValue}</dd></div>}
            </dl>
            {page.sizeChartLabel && page.sizeChartImage ? (
              <Dialog>
                <DialogTrigger asChild><Button variant="outline" data-page-button="chart" className="font-label flex items-center gap-1 border border-primary px-4 py-2 text-xs text-primary"><Ruler className="h-3.5 w-3.5" /> {page.sizeChartLabel}</Button></DialogTrigger>
                <DialogContent className="max-w-3xl"><DialogTitle>{page.sizeChartLabel}</DialogTitle><img src={page.sizeChartImage} alt={`Maattabel ${product.name}`} className="max-h-[75vh] w-full object-contain" /></DialogContent>
              </Dialog>
            ) : page.sizeChartLabel && (
              <Button asChild variant="outline"><a data-page-button="chart" href={page.sizeChartUrl || undefined} target={page.sizeChartUrl ? "_blank" : undefined} rel="noreferrer"
                className="font-label flex items-center gap-1 border border-primary px-4 py-2 text-xs text-primary">
                <Ruler className="h-3.5 w-3.5" /> {page.sizeChartLabel}
              </a></Button>
            )}
          </div>

          {page.intro && <div className="prose-shop mt-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeDescription(page.intro) }} />}

          {page.featureShow && (
            <div className="mt-5 bg-primary text-primary-foreground">
              <div className="flex items-center justify-between gap-3 px-4 py-4">
                <p className="font-label text-sm font-bold uppercase tracking-wider">{page.featureTitle}</p>
                {page.featureLinkUrl && (
                  <Button asChild variant="outline"><a href={page.featureLinkUrl} className="font-label flex items-center gap-1 border border-primary-foreground/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider">
                    {page.featureLinkLabel} <ChevronRight className="h-3 w-3" />
                  </a></Button>
                )}
              </div>
              {page.featureBadges.filter(Boolean).length > 0 && (
                <div className="grid grid-cols-2 border-t border-primary-foreground/30 sm:grid-cols-4">
                  {page.featureBadges.filter(Boolean).map((b, i) => (
                    <div key={i} className="font-label border-primary-foreground/30 px-2 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide [&:not(:last-child)]:border-r">{b}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-5 space-y-2">
            {page.accordions.filter((a) => a.title).map((a, i) => (
              <details key={`${handle}-${i}`} className="group border border-border bg-background">
                <summary className="font-label flex cursor-pointer list-none items-center justify-between px-4 py-4 text-xs uppercase tracking-wider">
                  {a.title}<ChevronUpIcon className="h-3.5 w-3.5 transition group-open:rotate-0 rotate-180" />
                </summary>
                <div className="prose-shop border-t border-border px-4 py-4 text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeDescription(a.html) }} />
              </details>
            ))}
          </div>
        </div>
      </div>
    </ShopLayout>
  );
}
