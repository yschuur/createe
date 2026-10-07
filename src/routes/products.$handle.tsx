import { createFileRoute, Link, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShopLayout } from "@/components/shop/ShopLayout";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import {
  formatPrice, imgUrl, isPurchasable, optionLabel, prettyValue, productQuery, sanitizeDescription,
} from "@/lib/shop";

export const Route = createFileRoute("/products/$handle")({
  loader: async ({ context, params }) => {
    if (params.handle === "createe-design-studio") throw redirect({ to: "/design-studio" });
    const p = await context.queryClient.ensureQueryData(productQuery(params.handle));
    if (!p) throw notFound();
    return { name: p.name, seoTitle: p.seo_title, seoDescription: p.seo_description, image: p.product_images[0]?.url ?? null };
  },
  head: ({ loaderData }) => {
    const title = loaderData?.seoTitle || `${loaderData?.name ?? "Product"} — CREATEE`;
    const description = loaderData?.seoDescription || `${loaderData?.name ?? "Product"} van CREATEE.`;
    const meta = [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "product" }, { name: "twitter:card", content: "summary_large_image" },
    ];
    if (loaderData?.image?.startsWith("https://")) {
      meta.push({ property: "og:image", content: loaderData.image }, { name: "twitter:image", content: loaderData.image } as never);
    }
    return { meta };
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
  const [activeImg, setActiveImg] = useState(0);
  if (!product) return null;

  const keys = ["option1_value", "option2_value", "option3_value"] as const;
  const variant = variants.find((v) => keys.every((k, i) => (v[k] ?? null) === (selected[i] ?? null)));
  const images = product.product_images;

  const choose = (idx: number, value: string) => {
    const next = [...selected];
    next[idx] = value;
    // keep a valid combination
    if (!variants.some((v) => keys.every((k, i) => (v[k] ?? null) === (next[i] ?? null)))) {
      const key = keys[idx]!;
      const m = variants.find((v) => v[key] === value);
      if (m) keys.forEach((k, i) => (next[i] = m[k]));
    }
    setSelected(next);
    const match = variants.find((v) => keys.every((k, i) => (v[k] ?? null) === (next[i] ?? null)));
    const vi = images.findIndex((im) => im.variant_id && (im.variant_id === match?.id || variants.find((x) => x.id === im.variant_id)?.color === match?.color));
    if (vi >= 0) setActiveImg(vi);
  };

  const add = () => {
    if (!variant || !isPurchasable(variant)) return;
    cart.add({
      variantId: variant.id, productSlug: product.slug, name: product.name, variantLabel: optionLabel(variant),
      price: Number(variant.price), image: imgUrl(images[activeImg]?.url ?? images[0]?.url, 200), quantity: 1,
      maxQuantity: variant.track_inventory && !variant.allow_backorder ? variant.inventory_quantity : null,
    });
    cart.setOpen(true);
    toast.success(`${product.name} toegevoegd`);
  };

  const hasOptions = optionNames.some(Boolean);
  const compareAt = variant?.compare_at_price && Number(variant.compare_at_price) > Number(variant.price) ? variant.compare_at_price : null;

  return (
    <ShopLayout>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-[1.2fr_1fr] md:px-8">
        <div className="space-y-3">
          <div className="aspect-[4/5] overflow-hidden rounded-sm bg-card">
            {images[activeImg] && <img src={imgUrl(images[activeImg].url, 1200)} alt={images[activeImg].alt_text ?? product.name} className="h-full w-full object-cover" />}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {images.map((im, i) => (
              <button key={im.id} onClick={() => setActiveImg(i)} className={`aspect-square overflow-hidden rounded-sm border-2 ${i === activeImg ? "border-primary" : "border-transparent"}`}>
                <img src={imgUrl(im.url, 200)} alt={im.alt_text ?? ""} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
        <div className="md:sticky md:top-24 md:self-start">
          <Link to="/" className="text-xs uppercase tracking-widest text-muted-foreground">{product.product_type}</Link>
          <h1 className="mt-2 text-5xl font-extrabold leading-none">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3 text-xl">
            <span className="font-semibold">{formatPrice(variant?.price ?? variants[0]?.price)}</span>
            {compareAt && <span className="text-base text-muted-foreground line-through">{formatPrice(compareAt)}</span>}
          </div>

          {hasOptions && optionNames.map((name, idx) => {
            if (!name) return null;
            const key = keys[idx]!;
            const values = Array.from(new Set(variants.map((v) => v[key]).filter(Boolean))) as string[];
            return (
              <div key={idx} className="mt-6">
                <p className="mb-2 text-sm font-medium">{name === "Vanille" ? "Kleur" : name}: <span className="text-muted-foreground">{prettyValue(selected[idx])}</span></p>
                <div className="flex flex-wrap gap-2">
                  {values.map((val) => {
                    const combo = [...selected]; combo[idx] = val;
                    const v = variants.find((x) => keys.every((k, i) => (x[k] ?? null) === (combo[i] ?? null)));
                    const available = v ? isPurchasable(v) : false;
                    return (
                      <button key={val} onClick={() => choose(idx, val)}
                        className={`min-w-12 rounded-sm border px-3 py-2 text-sm transition ${selected[idx] === val ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"} ${!available ? "line-through opacity-50" : ""}`}>
                        {prettyValue(val)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <Button size="lg" className="mt-8 w-full" onClick={add} disabled={!variant || !isPurchasable(variant)}>
            {!variant ? "Niet beschikbaar" : isPurchasable(variant) ? "In winkelmand" : "Uitverkocht"}
          </Button>
          {variant && variant.track_inventory && variant.inventory_quantity > 0 && variant.inventory_quantity <= 2 && (
            <p className="mt-2 text-center text-sm text-muted-foreground">Nog maar {variant.inventory_quantity} op voorraad</p>
          )}

          <div className="prose-shop mt-8 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: sanitizeDescription(product.description_html) }} />
          {(product.fit || product.fabric) && (
            <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-6 text-sm">
              {product.fit && (<><dt className="text-muted-foreground">Pasvorm</dt><dd>{product.fit}</dd></>)}
              {product.fabric && (<><dt className="text-muted-foreground">Materiaal</dt><dd>{product.fabric}</dd></>)}
            </dl>
          )}
        </div>
      </div>
    </ShopLayout>
  );
}
