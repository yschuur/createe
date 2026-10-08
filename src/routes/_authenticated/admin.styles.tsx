import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/styles")({
  beforeLoad: () => { throw redirect({ to: "/admin/pages" }); },
});
