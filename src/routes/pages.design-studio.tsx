import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pages/design-studio")({
  beforeLoad: () => { throw redirect({ to: "/design-studio" }); },
});