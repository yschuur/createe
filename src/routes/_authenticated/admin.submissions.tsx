import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  head: () => ({ meta: [{ title: "Inzendingen — Beheer" }] }),
  component: Submissions,
});

type Item = { id: string; kind: "contact" | "studio"; name: string; email: string; phone: string | null; created_at: string; message: string; extra: { label: string; value: string }[] };

function Submissions() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "contact" | "studio">("all");
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-submissions"],
    queryFn: async () => {
      const [c, s] = await Promise.all([
        supabase.from("contact_submissions").select("*").order("created_at", { ascending: false }),
        supabase.from("design_requests").select("*").order("created_at", { ascending: false }),
      ]);
      const items: Item[] = [
        ...(c.data ?? []).map((r) => ({ id: r.id, kind: "contact" as const, name: r.name, email: r.email, phone: r.phone, created_at: r.created_at, message: r.message, extra: [{ label: "Bestelnummer", value: r.order_number }] })),
        ...(s.data ?? []).map((r) => ({ id: r.id, kind: "studio" as const, name: r.name, email: r.email, phone: r.phone, created_at: r.created_at, message: r.message, extra: [{ label: "Aantal", value: r.quantity ? String(r.quantity) : "" }, { label: "Gelegenheid", value: r.occasion ?? "" }] })),
      ];
      return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
  });

  async function remove(i: Item) {
    if (!confirm(`Inzending van ${i.name} verwijderen?`)) return;
    const { error } = await supabase.from(i.kind === "contact" ? "contact_submissions" : "design_requests").delete().eq("id", i.id);
    if (error) { toast.error("Verwijderen mislukt"); return; }
    toast.success("Inzending verwijderd");
    qc.invalidateQueries({ queryKey: ["admin-submissions"] });
  }

  const list = (data ?? []).filter((i) => tab === "all" || i.kind === tab);
  return <AdminLayout title="Inzendingen">
    <div className="mb-4 flex gap-2">
      {([["all", "Alles"], ["contact", "Contact"], ["studio", "Design Studio"]] as const).map(([k, l]) =>
        <Button key={k} size="sm" variant={tab === k ? "default" : "outline"} onClick={() => setTab(k)}>{l}</Button>)}
    </div>
    {isLoading ? <p>Laden…</p> : !list.length ? <p className="text-muted-foreground">Nog geen inzendingen.</p> :
      <div className="space-y-3">
        {list.map((i) => <div key={i.id} className="rounded-lg border bg-card">
          <button className="flex w-full items-center justify-between gap-4 p-4 text-left" onClick={() => setOpen(open === i.id ? null : i.id)}>
            <div className="min-w-0">
              <div className="font-semibold">{i.name} <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-normal">{i.kind === "contact" ? "Contact" : "Design Studio"}</span></div>
              <div className="truncate text-sm text-muted-foreground">{i.message.split("\n")[0]}</div>
            </div>
            <div className="shrink-0 text-sm text-muted-foreground">{new Date(i.created_at).toLocaleString("nl-NL")}</div>
          </button>
          {open === i.id && <div className="space-y-3 border-t p-4 text-sm">
            <dl className="grid gap-2 sm:grid-cols-[140px_1fr]">
              <dt className="text-muted-foreground">E-mail</dt><dd><a className="underline" href={`mailto:${i.email}`}>{i.email}</a></dd>
              {i.phone && <><dt className="text-muted-foreground">Telefoon</dt><dd>{i.phone}</dd></>}
              {i.extra.filter((e) => e.value).map((e) => <><dt key={e.label} className="text-muted-foreground">{e.label}</dt><dd>{e.value}</dd></>)}
            </dl>
            <div><div className="mb-1 text-muted-foreground">Bericht</div><p className="whitespace-pre-wrap rounded bg-muted p-3">{i.message}</p></div>
            <Button variant="destructive" size="sm" onClick={() => remove(i)}><Trash2 className="mr-1 h-4 w-4" />Verwijderen</Button>
          </div>}
        </div>)}
      </div>}
  </AdminLayout>;
}
