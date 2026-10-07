<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Shop data lives in Lovable Cloud tables (products, product_variants, product_images, collections, collection_products, discounts, design_requests); public reads go through the browser client with RLS, admin writes rely on `has_role(..., 'admin')` RLS — keeps logic in one place without server functions.
- Shopify CSV parsing/import lives in `src/lib/shopify-import.ts` and groups rows by Handle; reuse it for any future import so slugs stay stable.
- Brand logos are only rendered via `src/components/Logo.tsx` (white/green/favicon) so official assets are never re-drawn.
- Product HTML is sanitized with sanitize-html before rendering (worker-safe, works in SSR).
- Original editorial pages use /pages/ons-verhaal and /pages/de-hybr-polo, with /pages/design-studio redirecting to /design-studio — preserves original links while keeping one request form.
- Screenshot-led storefront styles are scoped with .storefront and semantic shop surface tokens — keeps the admin design unchanged.
