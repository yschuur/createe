import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fragment, useState } from "react";
import { toast } from "sonner";
import { Paperclip, Send, Trash2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { replyToSubmission } from "@/lib/submissions.functions";

export const Route = createFileRoute("/_authenticated/admin/submissions")({
  head: () => ({ meta: [{ title: "Inzendingen - Beheer" }] }),
  component: Submissions,
});

type Reply = { at: string; subject: string; message: string };
type Item = { id: string; kind: "contact" | "studio"; name: string; email: string; phone: string | null; created_at: string; message: string; files: string[]; replies: Reply[]; extra: { label: string; value: string }[] };

/** Studio messages store uploaded files as "Bestand: <path>" lines. */
function splitFiles(message: string) {
  const files: string[] = [];
  const text = message.split("\n").filter((l) => {
    const m = l.match(/^Bestand: (requests\/\S+)$/);
    if (m) { files.push(m[1]!); return false; }
    return true;
  }).join("\n");
  return { text, files };
}

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
        ...(c.data ?? []).map((r) => ({ id: r.id, kind: "contact" as const, name: r.name, email: r.email, phone: r.phone, created_at: r.created_at, message: r.message, files: [], replies: (r.replies as Reply[]) ?? [], extra: [{ label: "Bestelnummer", value: r.order_number }] })),
        ...(s.data ?? []).map((r) => { const { text, files } = splitFiles(r.message); return { id: r.id, kind: "studio" as const, name: r.name, email: r.email, phone: r.phone, created_at: r.created_at, message: text, files, replies: (r.replies as Reply[]) ?? [], extra: [{ label: "Aantal", value: r.quantity ? String(r.quantity) : "" }, { label: "Gelegenheid", value: r.occasion ?? "" }] }; }),
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
              <div className="font-semibold">{i.name}
                <span className="ml-2 rounded bg-muted px-2 py-0.5 text-xs font-normal">{i.kind === "contact" ? "Contact" : "Design Studio"}</span>
                {i.files.length > 0 && <span className="ml-2 inline-flex items-center gap-1 text-xs font-normal text-muted-foreground"><Paperclip className="h-3 w-3" />{i.files.length}</span>}
                {i.replies.length > 0 && <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-normal text-primary">Beantwoord</span>}
              </div>
              <div className="truncate text-sm text-muted-foreground">{i.message.split("\n")[0]}</div>
            </div>
            <div className="shrink-0 text-sm text-muted-foreground">{new Date(i.created_at).toLocaleString("nl-NL")}</div>
          </button>
          {open === i.id && <Detail item={i} onRemove={() => remove(i)} />}
        </div>)}
      </div>}
  </AdminLayout>;
}

function Detail({ item: i, onRemove }: { item: Item; onRemove: () => void }) {
  const qc = useQueryClient();
  const reply = useServerFn(replyToSubmission);
  const [subject, setSubject] = useState(i.kind === "contact" ? "Re: je bericht aan CREATEE" : "Re: je designaanvraag bij CREATEE");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const { data: urls } = useQuery({
    queryKey: ["submission-files", i.id],
    enabled: i.files.length > 0,
    queryFn: async () => {
      const { data } = await supabase.storage.from("studio-assets").createSignedUrls(i.files, 3600);
      return (data ?? []).map((d) => ({ path: d.path ?? "", url: d.signedUrl ?? "" }));
    },
  });

  async function send() {
    if (!msg.trim()) { toast.error("Schrijf eerst een reactie"); return; }
    setBusy(true);
    const r = await reply({ data: { kind: i.kind, id: i.id, subject, message: msg } }).catch(() => ({ ok: false, error: "Versturen mislukt" }));
    setBusy(false);
    if (!r.ok) { toast.error(r.error || "Versturen mislukt"); return; }
    toast.success(`Reactie verstuurd naar ${i.email}`);
    setMsg("");
    qc.invalidateQueries({ queryKey: ["admin-submissions"] });
  }

  return <div className="space-y-4 border-t p-4 text-sm">
    <dl className="grid gap-2 sm:grid-cols-[140px_1fr]">
      <dt className="text-muted-foreground">E-mail</dt><dd><a className="underline" href={`mailto:${i.email}`}>{i.email}</a></dd>
      {i.phone && <><dt className="text-muted-foreground">Telefoon</dt><dd>{i.phone}</dd></>}
      {i.extra.filter((e) => e.value).map((e) => <Fragment key={e.label}><dt className="text-muted-foreground">{e.label}</dt><dd>{e.value}</dd></Fragment>)}
    </dl>
    <div><div className="mb-1 text-muted-foreground">Bericht</div><p className="whitespace-pre-wrap rounded bg-muted p-3">{i.message}</p></div>
    {i.files.length > 0 && <div>
      <div className="mb-2 text-muted-foreground">Bijgevoegde afbeeldingen ({i.files.length})</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(urls ?? []).map((f) => /\.(pdf)$/i.test(f.path)
          ? <a key={f.path} href={f.url} target="_blank" rel="noreferrer" className="flex aspect-square items-center justify-center rounded border bg-muted underline">PDF openen</a>
          : <a key={f.path} href={f.url} target="_blank" rel="noreferrer" title="Openen op volledige grootte"><img src={f.url} alt="Bijlage" className="aspect-square w-full rounded border object-cover" /></a>)}
      </div>
    </div>}
    {i.replies.length > 0 && <div className="space-y-2">
      <div className="text-muted-foreground">Verstuurde reacties</div>
      {i.replies.map((r, n) => <div key={n} className="rounded border-l-4 border-primary bg-muted/50 p-3">
        <div className="mb-1 text-xs text-muted-foreground">{new Date(r.at).toLocaleString("nl-NL")} - {r.subject}</div>
        <p className="whitespace-pre-wrap">{r.message}</p>
      </div>)}
    </div>}
    <div className="space-y-2 rounded border p-3">
      <div className="font-medium">Reageren aan {i.email}</div>
      <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Onderwerp" />
      <Textarea rows={6} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Schrijf je reactie…" />
      <div className="flex justify-between">
        <Button size="sm" onClick={send} disabled={busy}><Send className="mr-1 h-4 w-4" />{busy ? "Versturen…" : "Reactie versturen"}</Button>
        <Button variant="destructive" size="sm" onClick={onRemove}><Trash2 className="mr-1 h-4 w-4" />Verwijderen</Button>
      </div>
    </div>
  </div>;
}
