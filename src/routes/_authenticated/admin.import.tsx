import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { parseShopifyCsv, runImport, type ImportSummary, type ParseResult } from "@/lib/shopify-import";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/import")({
  head: () => ({ meta: [{ title: "Importeren — CREATEE beheer" }, { name: "robots", content: "noindex" }] }),
  component: ImportPage,
});

function ImportPage() {
  const qc = useQueryClient();
  const [parsed, setParsed] = useState<ParseResult | null>(null);
  const [existing, setExisting] = useState<Set<string>>(new Set());
  const [mode, setMode] = useState<"skip" | "update">("skip");
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<ImportSummary | null>(null);

  async function onFile(f: File) {
    setResult(null);
    const r = parseShopifyCsv(await f.text());
    setParsed(r);
    const { data } = await supabase.from("products").select("slug");
    setExisting(new Set((data ?? []).map((p) => p.slug)));
  }

  async function confirm() {
    if (!parsed) return;
    setProgress(0);
    const s = await runImport(parsed.products, mode, setProgress);
    setProgress(null);
    setResult(s);
    qc.invalidateQueries();
  }

  const variantCount = parsed?.products.reduce((a, p) => a + p.variants.length, 0) ?? 0;
  const dupes = parsed?.products.filter((p) => existing.has(p.slug)).length ?? 0;

  return (
    <AdminLayout title="Importeren">
      <div className="space-y-6">
        <div className="rounded-sm bg-card p-6">
          <h2 className="text-lg font-semibold">Shopify product-CSV</h2>
          <p className="mt-1 text-sm text-muted-foreground">Upload een productexport uit Shopify. Je ziet eerst een voorbeeld; er wordt pas iets opgeslagen na bevestiging.</p>
          <input type="file" accept=".csv,text/csv" className="mt-4 block text-sm" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </div>

        {parsed && !result && (
          <div className="space-y-4 rounded-sm bg-card p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Regels" value={parsed.rowCount} /><Stat label="Producten" value={parsed.products.length} />
              <Stat label="Varianten" value={variantCount} /><Stat label="Fouten" value={parsed.errors.length} />
            </div>
            {parsed.errors.length > 0 && (
              <ul className="max-h-40 overflow-auto rounded-sm bg-destructive/10 p-3 text-sm">
                {parsed.errors.map((e, i) => <li key={i}>Regel {e.row}: {e.message}</li>)}
              </ul>
            )}
            <div className="max-h-80 overflow-auto rounded-sm border border-border">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted text-left"><tr><th className="p-2">Handle</th><th className="p-2">Naam</th><th className="p-2">Status</th><th className="p-2">Varianten</th><th className="p-2">Afb.</th><th className="p-2"></th></tr></thead>
                <tbody>
                  {parsed.products.map((p) => (
                    <tr key={p.slug} className="border-t border-border">
                      <td className="p-2 font-mono text-xs">{p.slug}</td><td className="p-2">{p.name}</td><td className="p-2">{p.status}</td>
                      <td className="p-2">{p.variants.length}</td><td className="p-2">{p.images.length}</td>
                      <td className="p-2 text-xs">{existing.has(p.slug) ? "bestaat al" : "nieuw"}{p.is_service ? " · dienst" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {dupes > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium">{dupes} product(en) bestaan al. Wat wil je doen?</p>
                <RadioGroup value={mode} onValueChange={(v) => setMode(v as "skip" | "update")} className="flex gap-6">
                  <div className="flex items-center gap-2"><RadioGroupItem value="skip" id="skip" /><Label htmlFor="skip">Overslaan</Label></div>
                  <div className="flex items-center gap-2"><RadioGroupItem value="update" id="update" /><Label htmlFor="update">Bijwerken</Label></div>
                </RadioGroup>
              </div>
            )}
            <Button onClick={confirm} disabled={progress != null || parsed.products.length === 0}>
              {progress != null ? `Bezig… ${progress + 1}/${parsed.products.length}` : "Import bevestigen"}
            </Button>
          </div>
        )}

        {result && (
          <div className="space-y-3 rounded-sm bg-card p-6">
            <h2 className="text-lg font-semibold">Import voltooid</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Stat label="Gevonden" value={result.found} /><Stat label="Aangemaakt" value={result.created} />
              <Stat label="Bijgewerkt" value={result.updated} /><Stat label="Overgeslagen" value={result.skipped} />
              <Stat label="Varianten" value={result.variants} /><Stat label="Afbeeldingen" value={result.images} /><Stat label="Fouten" value={result.errors.length} />
            </div>
            {result.errors.length > 0 && <ul className="text-sm text-destructive">{result.errors.map((e) => <li key={e}>{e}</li>)}</ul>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-sm bg-muted p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="text-2xl font-semibold">{value}</p></div>;
}
