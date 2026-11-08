import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Save, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { reviewsQuery, reviewsSettingsSchema, type ReviewsSettings } from "@/lib/reviews";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  head: () => ({ meta: [{ title: "Reviews - Beheer" }] }),
  component: AdminReviews,
});

type Review = ReviewsSettings["reviews"][number];

function AdminReviews() {
  const qc = useQueryClient();
  const { data } = useQuery(reviewsQuery());
  const [draft, setDraft] = useState<ReviewsSettings | null>(null);
  const cur = draft ?? data;
  if (!cur) return <AdminLayout title="Reviews"><p>Laden…</p></AdminLayout>;

  const setReviews = (reviews: Review[]) => setDraft({ ...cur, reviews });
  const upd = (i: number, k: keyof Review, v: string) => setReviews(cur.reviews.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const move = (i: number, d: number) => {
    const a = [...cur.reviews]; const j = i + d; if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; setReviews(a);
  };

  async function save() {
    const r = reviewsSettingsSchema.safeParse(cur);
    if (!r.success) { toast.error("Controleer de velden. Een tekst is te lang."); return; }
    const { error } = await supabase.from("site_settings").upsert({ key: "reviews", value: r.data }, { onConflict: "key" });
    if (error) { toast.error("Opslaan mislukt."); return; }
    qc.setQueryData(reviewsQuery().queryKey, r.data); setDraft(null); toast.success("Reviews opgeslagen");
  }

  return <AdminLayout title="Reviews" actions={<Button onClick={save} disabled={!draft}><Save className="mr-2 size-4" />Opslaan</Button>}>
    <div className="max-w-3xl space-y-6">
      <div className="grid gap-4 rounded-sm bg-card p-6 sm:grid-cols-3">
        <label className="block text-sm">Kop<Input value={cur.heading} onChange={e => setDraft({ ...cur, heading: e.target.value })} /></label>
        <label className="block text-sm">Aantal reviews (tekst)<Input value={cur.total} onChange={e => setDraft({ ...cur, total: e.target.value })} /></label>
        <label className="block text-sm">Trustpilot-link<Input value={cur.link} onChange={e => setDraft({ ...cur, link: e.target.value })} /></label>
        <p className="text-xs text-muted-foreground sm:col-span-3">Onderaan de site staat "Gebaseerd op {cur.total || "0"} reviews". Dit aantal vul je zelf in.</p>
      </div>
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{cur.reviews.length} reviews</h2>
        <Button variant="outline" onClick={() => setReviews([{ author: "", date: "", title: "", text: "" }, ...cur.reviews])}><Plus className="mr-2 size-4" />Review toevoegen</Button>
      </div>
      {cur.reviews.map((r, i) => <div key={i} className="space-y-3 rounded-sm bg-card p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">Naam<Input value={r.author} onChange={e => upd(i, "author", e.target.value)} /></label>
          <label className="block text-sm">Datum<Input value={r.date} placeholder="28 sep 2026" onChange={e => upd(i, "date", e.target.value)} /></label>
        </div>
        <label className="block text-sm">Titel<Input value={r.title} onChange={e => upd(i, "title", e.target.value)} /></label>
        <label className="block text-sm">Tekst<Textarea rows={4} value={r.text} onChange={e => upd(i, "text", e.target.value)} /></label>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" aria-label="Omhoog" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="size-4" /></Button>
          <Button size="sm" variant="ghost" aria-label="Omlaag" onClick={() => move(i, 1)} disabled={i === cur.reviews.length - 1}><ArrowDown className="size-4" /></Button>
          <Button size="sm" variant="ghost" className="ml-auto text-destructive" onClick={() => setReviews(cur.reviews.filter((_, j) => j !== i))}><Trash2 className="mr-1 size-4" />Verwijderen</Button>
        </div>
      </div>)}
    </div>
  </AdminLayout>;
}
