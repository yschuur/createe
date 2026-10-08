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
- Product swatch colors resolve through src/lib/product-colors.ts to storefront CSS tokens; ordered per-color image IDs live in products.metadata.gallery and resolve through src/lib/product-gallery.ts with legacy variant-image fallback — keeps admin, product galleries and previews consistent without schema changes.
- Shop data lives in Lovable Cloud tables (products, product_variants, product_images, collections, collection_products, discounts, design_requests); public reads go through the browser client with RLS, admin writes rely on `has_role(..., 'admin')` RLS — keeps logic in one place without server functions.
- Shopify CSV parsing/import lives in `src/lib/shopify-import.ts` and groups rows by Handle; reuse it for any future import so slugs stay stable.
- Brand logos are only rendered via `src/components/Logo.tsx` (white/green/favicon) so official assets are never re-drawn.
- Product HTML is sanitized with sanitize-html before rendering (worker-safe, works in SSR).
- Original editorial pages use /pages/ons-verhaal and /pages/de-hybr-polo, with /pages/design-studio redirecting to /design-studio — preserves original links while keeping one request form.
- Screenshot-led storefront styles are scoped with .storefront and semantic shop surface tokens — keeps the admin design unchanged.
- Shared storefront testimonials render through Reviews in ShopLayout — keeps the reference footer area consistent across public pages.
- Design Studio choices are included in the existing request message without changing the schema — preserves the admin request readback and keeps this restyle frontend-only.
- Editable storefront content (homepage header, announcement bar, carousel order) lives as JSON rows in `site_settings`, read publicly and written by admins via RLS — lets the owner change copy without code.
- Hero videos are transcoded to H.264 MP4 without audio before upload — .mov/PCM audio is heavy and not reliably playable in browsers.
- Site navigation is a nested JSON tree in `site_settings` (key "menu") rendered by SiteMenu — supports unlimited submenu depth without schema changes.
- Storefront design-pack tokens are scoped under .storefront with per-page classes (page-home/page-studio/page-story) via ShopLayout `page` prop — page-specific styling without touching admin.
- About pages use scoped screenshot-led page-story layouts and retain existing data-section identifiers and rich-text fields — reference composition stays editable without affecting Studio/admin.
- Legacy section_styles remains read-compatible without a separate admin editor, and its CSS never targets rich-copy descendants — preserves saved defaults without overriding per-field formatting.
- Design Studio scorecard reviews and per-color configurator photos live in `site_settings` (key "studio") via src/lib/studio.ts, edited at /admin/studio; photos are referenced by URL because public storage buckets are blocked in this workspace.
- All admin photo/video fields pick from the shared media library (media_assets table + MediaField/MediaLibraryDialog in src/components/admin/MediaLibrary.tsx); uploads go to the private studio-assets bucket under media/ with long-lived signed URLs — one reusable source of media because public buckets are blocked.
- Owner-editable longer texts and editorial page titles use RichTextEditor and sanitized PageText rendering; button labels, links and administrative names stay plain inputs — formatting belongs to the individual copy field while headings retain valid semantic HTML.
- Page-level CMS lives in `src/lib/page-settings.ts`: a section registry (PAGE_DEFS) holds code defaults, overrides are stored per page in `site_settings` (`page_<key>`), deep-merged over defaults, Zod-validated and turned into CSS only via the whitelisted `buildPageCss`; edited at /admin/pages — site never depends on a DB row and admin input cannot inject CSS. New editable sections are added to PAGE_DEFS plus `data-section`/`data-role` markers.
- Editorial page button overrides are keyed by button ID in each section and compiled by the validated page CSS builder — individual buttons can change independently while existing section-wide defaults remain compatible.
- The router serializes and hydrates its request-scoped QueryClient — saved page content must match on server render and the first browser render.
- Storefront button styles use the page CMS with global defaults, registered section/action targets and per-button overrides, including hover/focus colors — one validated CSS builder covers native buttons and portaled shop dialogs while admin stays unchanged.
- RichTextEditor renders EditorContent as soon as its editor exists, with toolbar state fallbacks — remounting a populated field must not leave an invisible editor waiting for its first transaction.
