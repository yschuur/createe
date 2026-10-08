import { createFileRoute } from "@tanstack/react-router";
import { defaultMenu, type MenuItem } from "@/lib/menu";

const BASE_URL = "https://createe.lovable.app";

function collectPaths(items: MenuItem[], out: Set<string>) {
  for (const item of items) {
    const link = (item.link || "").trim();
    if (link.startsWith("/") && !link.startsWith("//")) {
      const path = link.split(/[?#]/)[0] || "/";
      if (!/^\/(admin|auth|checkout|api|pages\/design-studio)(\/|$)/.test(path)) out.add(path);
    }
    if (item.children?.length) collectPaths(item.children, out);
  }
}

const esc = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
          auth: { persistSession: false, autoRefreshToken: false },
          global: {
            fetch: (input, init) => {
              const headers = new Headers(init?.headers);
              if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) headers.delete("Authorization");
              headers.set("apikey", key);
              return fetch(input, { ...init, headers });
            },
          },
        });
        const { data, error } = await supabase.from("site_settings").select("value").eq("key", "menu").maybeSingle();
        if (error) return new Response("Sitemap unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
        const items = (data?.value as { items?: MenuItem[] } | null)?.items;
        const paths = new Set<string>(["/"]);
        collectPaths(items?.length ? items : defaultMenu, paths);

        const pageSize = 1000;
        async function all<T>(fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
          const rows: T[] = [];
          for (let offset = 0; ; ) {
            const { data, error } = await fetchPage(offset, offset + pageSize - 1);
            if (error) throw error;
            if (!data?.length) break;
            rows.push(...data);
            offset += data.length;
          }
          return rows;
        }
        try {
          const [sports, collections, products] = await Promise.all([
            all<{ id: string; slug: string }>((a, b) => supabase.from("sports").select("id, slug").order("id").range(a, b)),
            all<{ slug: string; sport_ids: string[] }>((a, b) => supabase.from("collections").select("id, slug, sport_ids").eq("published", true).order("id").range(a, b)),
            all<{ slug: string }>((a, b) => supabase.from("products").select("id, slug").eq("status", "active").eq("published", true).eq("is_service", false).order("id").range(a, b)),
          ]);
          const sportSlug = new Map(sports.map((s) => [s.id, s.slug]));
          for (const s of sports) paths.add(`/collections/${encodeURIComponent(s.slug)}`);
          for (const c of collections) {
            const sport = c.sport_ids.map((id) => sportSlug.get(id)).find(Boolean);
            if (sport) paths.add(`/collections/${encodeURIComponent(sport)}?collection=${encodeURIComponent(c.slug)}`);
          }
          for (const p of products) paths.add(`/products/${encodeURIComponent(p.slug)}`);
        } catch {
          return new Response("Sitemap unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
        }
        const urls = [...paths]
          .map((p) => `<url><loc>${esc(new URL(p, BASE_URL).href)}</loc></url>`)
          .join("");
        return new Response(
          `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
          { headers: { "Content-Type": "application/xml", "Cache-Control": "public, max-age=3600" } },
        );
      },
    },
  },
});
