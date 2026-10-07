import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Inloggen — CREATEE beheer" },
      { name: "description", content: "Inloggen op het CREATEE beheerpaneel." },
      { property: "og:title", content: "Inloggen — CREATEE beheer" },
      { property: "og:description", content: "Inloggen op het CREATEE beheerpaneel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email")).trim();
    const password = String(fd.get("password"));
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error("Inloggen mislukt: controleer je gegevens."); return; }
      nav({ to: "/admin" });
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/admin` } });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Check je mail om je account te bevestigen.");
      setMode("in");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-primary px-4">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4 rounded-sm bg-background p-8 shadow-xl">
        <Logo variant="green" className="mx-auto h-8" />
        <p className="text-center text-sm text-muted-foreground">Beheerpaneel</p>
        <div><Label htmlFor="email">E-mail</Label><Input id="email" name="email" type="email" required /></div>
        <div><Label htmlFor="password">Wachtwoord</Label><Input id="password" name="password" type="password" minLength={8} required /></div>
        <Button className="w-full" disabled={busy}>{mode === "in" ? "Inloggen" : "Account aanmaken"}</Button>
        <button type="button" onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-center text-xs text-muted-foreground underline">
          {mode === "in" ? "Nog geen account? Aanmaken" : "Al een account? Inloggen"}
        </button>
      </form>
    </div>
  );
}
