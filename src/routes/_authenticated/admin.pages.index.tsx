import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { PAGE_DEFS } from "@/lib/page-settings";

export const Route = createFileRoute("/_authenticated/admin/pages/")({
  head: () => ({ meta: [{ title: "Pagina's — CREATEE beheer" }, { name: "description", content: "Pas teksten, foto's en stijl van elke pagina aan." }, { property: "og:title", content: "Pagina's — CREATEE beheer" }, { property: "og:description", content: "Pas teksten, foto's en stijl van elke pagina aan." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: PagesIndex,
});

function PagesIndex() {
  return <AdminLayout title="Pagina's">
    <p className="mb-6 text-sm text-muted-foreground">Kies een pagina. Per onderdeel pas je teksten, foto's, kleuren, lettertypes en ruimte aan. Wat je niet invult, blijft zoals het nu is.</p>
    <div className="grid gap-3 md:grid-cols-2">
      {PAGE_DEFS.map((p) => <Link key={p.key} to="/admin/pages/$page" params={{ page: p.slug }} className="flex items-center justify-between gap-4 rounded-sm bg-card p-5 hover:ring-1 hover:ring-primary">
        <div><p className="font-semibold">{p.label}</p><p className="mt-1 text-sm text-muted-foreground">{p.description}</p><p className="mt-2 text-xs text-muted-foreground">{p.sections.length} onderdelen</p></div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>)}
      {extras.map((e) => <Link key={e.to} to={e.to} className="flex items-center justify-between gap-4 rounded-sm bg-card p-5 hover:ring-1 hover:ring-primary">
        <div><p className="font-semibold">{e.label}</p><p className="mt-1 text-sm text-muted-foreground">{e.description}</p></div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </Link>)}
    </div>
  </AdminLayout>;
}
