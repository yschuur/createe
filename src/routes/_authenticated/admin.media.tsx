import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { MediaGrid } from "@/components/admin/MediaLibrary";

export const Route = createFileRoute("/_authenticated/admin/media")({
  head: () => ({ meta: [{ title: "Mediabibliotheek | CREATEE beheer" }, { name: "description", content: "Alle foto's en video's van de CREATEE webshop." }, { property: "og:title", content: "Mediabibliotheek | CREATEE beheer" }, { property: "og:description", content: "Alle foto's en video's op één plek." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] }),
  component: () => <AdminLayout title="Mediabibliotheek"><div className="rounded-sm bg-card p-6"><MediaGrid manage /></div></AdminLayout>,
});
