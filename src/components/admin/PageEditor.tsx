import { useEffect, useState, type ReactNode } from "react";
import { RotateCcw, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaField } from "@/components/admin/MediaLibrary";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { FONTS } from "@/lib/section-styles";
import {
  COLOR_TOKENS, isValidColor, safeColor,
  type ButtonStyle, type BackgroundStyle, type Position, type ResponsiveNumber, type RoleId, type SectionConfig, type SectionDef, type TypographyStyle,
} from "@/lib/page-settings";

const sel = "h-9 w-full rounded-sm border border-input bg-background px-2 text-sm";
const ROLE_LABELS: Record<RoleId, string> = { kicker: "Kicker (klein label boven titel)", heading: "Koppen", subheading: "Subkoppen", body: "Tekst", label: "Labels", link: "Links", price: "Prijs", button: "Knoppen (tekst)" };
const POS_LABELS: Record<Position, string> = { center: "Midden", top: "Boven", bottom: "Onder", left: "Links", right: "Rechts" };
const SPACE_PRESETS: [string, number][] = [["XS", 8], ["S", 16], ["M", 32], ["L", 56], ["XL", 88], ["XXL", 128]];
const num = (v: string) => (v === "" ? undefined : Number(v));

export function ResetLink({ onClick, label = "Reset naar standaard" }: { onClick: () => void; label?: string }) {
  return <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"><RotateCcw className="size-3" />{label}</button>;
}
function Field({ label, children, onReset, changed }: { label: string; children: ReactNode; onReset?: (() => void) | undefined; changed?: boolean }) {
  return <div className="space-y-1">
    <div className="flex items-center justify-between gap-2"><Label className="text-xs">{label}{changed && <span className="ml-1 text-primary">•</span>}</Label>{changed && onReset && <ResetLink onClick={onReset} label="Standaard" />}</div>
    {children}
  </div>;
}

export function ColorField({ value, onChange, allowEmpty = true }: { value: string | undefined; onChange: (v: string | undefined) => void; allowEmpty?: boolean }) {
  const [text, setText] = useState(value ?? "");
  useEffect(() => { setText(value ?? ""); }, [value]);
  const resolved = safeColor(value);
  const hexForPicker = value && COLOR_TOKENS[value] ? COLOR_TOKENS[value].swatch : resolved?.startsWith("#") ? resolved : "#275c38";
  const invalid = !!text && !isValidColor(text);
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-1.5">
      {Object.entries(COLOR_TOKENS).map(([k, t]) => <button key={k} type="button" title={t.label} aria-label={t.label} onClick={() => onChange(k)}
        className={`size-6 rounded-full border ${value === k ? "ring-2 ring-primary ring-offset-1" : "border-border"}`} style={{ backgroundColor: t.swatch }} />)}
      <input type="color" aria-label="Eigen kleur" value={hexForPicker.length === 4 ? "#" + hexForPicker.slice(1).split("").map((x) => x + x).join("") : hexForPicker} onChange={(e) => onChange(e.target.value)} className="size-7 cursor-pointer rounded border border-border bg-transparent p-0" />
      {allowEmpty && value && <ResetLink onClick={() => onChange(undefined)} label="Geen" />}
    </div>
    <Input value={value && COLOR_TOKENS[value] ? COLOR_TOKENS[value].label : text} placeholder="#275C38" aria-invalid={invalid}
      className={invalid ? "border-destructive" : ""}
      onChange={(e) => { const v = e.target.value.trim(); setText(v); if (!v) onChange(undefined); else if (isValidColor(v)) onChange(v); }} />
    {invalid && <p className="text-xs text-destructive">Ongeldige kleur — gebruik bijvoorbeeld #275C38</p>}
  </div>;
}

export function ResponsiveNumberField({ label, value, onChange, min, max, step = 1, unit }: { label: string; value: ResponsiveNumber | undefined; onChange: (v: ResponsiveNumber | undefined) => void; min: number; max: number; step?: number | undefined; unit: string }) {
  const set = (k: "mobile" | "desktop", v: number | undefined) => { const n = { ...value, [k]: v }; onChange(n.mobile === undefined && n.desktop === undefined ? undefined : n); };
  return <Field label={label} changed={!!value} onReset={() => onChange(undefined)}>
    <div className="grid grid-cols-2 gap-2">
      <div><span className="text-[11px] text-muted-foreground">Desktop {unit && `(${unit})`}</span><Input type="number" min={min} max={max} step={step} value={value?.desktop ?? ""} placeholder="—" onChange={(e) => set("desktop", num(e.target.value))} /></div>
      <div><span className="text-[11px] text-muted-foreground">Mobiel {unit && `(${unit})`}</span><Input type="number" min={min} max={max} step={step} value={value?.mobile ?? ""} placeholder="= desktop" onChange={(e) => set("mobile", num(e.target.value))} /></div>
    </div>
  </Field>;
}

export function TypographyEditor({ role, value, onChange }: { role: RoleId; value: TypographyStyle | undefined; onChange: (v: TypographyStyle | undefined) => void }) {
  const v = value ?? {};
  const set = (patch: Partial<TypographyStyle>) => onChange({ ...v, ...patch });
  return <div className="space-y-3 rounded-sm border border-border p-4">
    <div className="flex items-center justify-between"><p className="font-medium">{ROLE_LABELS[role]}</p>{value && <ResetLink onClick={() => onChange(undefined)} />}</div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="Lettertype"><select className={sel} value={v.font ?? ""} onChange={(e) => set({ font: e.target.value || undefined })}><option value="">Standaard</option>{Object.keys(FONTS).map((f) => <option key={f}>{f}</option>)}</select></Field>
      <Field label="Dikte"><select className={sel} value={v.weight ?? ""} onChange={(e) => set({ weight: num(e.target.value) })}><option value="">Standaard</option>{[100, 200, 300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}</select></Field>
      <Field label="Regelhoogte"><Input type="number" step={0.05} min={0.8} max={3} value={v.lineHeight ?? ""} placeholder="—" onChange={(e) => set({ lineHeight: num(e.target.value) })} /></Field>
      <Field label="Letterafstand"><Input type="number" step={0.01} min={-0.1} max={0.5} value={v.letterSpacing ?? ""} placeholder="—" onChange={(e) => set({ letterSpacing: num(e.target.value) })} /></Field>
      <Field label="Hoofdletters"><select className={sel} value={v.transform ?? "default"} onChange={(e) => set({ transform: e.target.value === "default" ? undefined : (e.target.value as TypographyStyle["transform"]) })}><option value="default">Standaard</option><option value="uppercase">HOOFDLETTERS</option><option value="lowercase">kleine letters</option><option value="capitalize">Eerste Letter Groot</option></select></Field>
      <Field label="Uitlijning"><select className={sel} value={v.align ?? ""} onChange={(e) => set({ align: (e.target.value || undefined) as TypographyStyle["align"] })}><option value="">Standaard</option><option value="left">Links</option><option value="center">Midden</option><option value="right">Rechts</option></select></Field>
      <div className="sm:col-span-2"><ResponsiveNumberField label="Grootte" unit="px" min={8} max={160} value={v.size} onChange={(size) => set({ size })} /></div>
    </div>
    <Field label="Tekstkleur"><ColorField value={v.color} onChange={(color) => set({ color })} /></Field>
  </div>;
}

function BackgroundEditor({ value, onChange, image }: { value: BackgroundStyle | undefined; onChange: (v: BackgroundStyle | undefined) => void; image?: boolean | undefined }) {
  const v = value ?? {};
  const set = (patch: Partial<BackgroundStyle>) => onChange({ ...v, ...patch });
  return <div className="space-y-3 rounded-sm border border-border p-4">
    <div className="flex items-center justify-between"><p className="font-medium">Achtergrond</p>{value && <ResetLink onClick={() => onChange(undefined)} />}</div>
    <Field label="Achtergrondkleur"><ColorField value={v.color} onChange={(color) => set({ color })} /></Field>
    {image && <>
      <Field label="Achtergrondafbeelding (leeg = geen)"><MediaField value={v.image ?? ""} onChange={(u) => set({ image: u || undefined })} /></Field>
      {v.image && <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Vullen"><select className={sel} value={v.size ?? "cover"} onChange={(e) => set({ size: e.target.value as "cover" | "contain" })}><option value="cover">Hele vlak vullen</option><option value="contain">Hele foto tonen</option></select></Field>
        <Field label="Positie"><select className={sel} value={v.position ?? "center"} onChange={(e) => set({ position: e.target.value as Position })}>{Object.entries(POS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        <Field label="Overlay sterkte (%)"><Input type="number" min={0} max={100} value={v.overlayOpacity ?? ""} placeholder="0" onChange={(e) => set({ overlayOpacity: num(e.target.value) })} /></Field>
        <div className="sm:col-span-3"><Field label="Overlay kleur"><ColorField value={v.overlay} onChange={(overlay) => set({ overlay })} /></Field></div>
      </div>}
    </>}
  </div>;
}

function ButtonEditor({ value, onChange }: { value: ButtonStyle | undefined; onChange: (v: ButtonStyle | undefined) => void }) {
  const v = value ?? {};
  const set = (patch: Partial<ButtonStyle>) => onChange({ ...v, ...patch });
  const n = (k: keyof ButtonStyle, label: string, min: number, max: number) => <Field label={label}><Input type="number" min={min} max={max} value={(v[k] as number | undefined) ?? ""} placeholder="—" onChange={(e) => set({ [k]: num(e.target.value) })} /></Field>;
  return <div className="space-y-3 rounded-sm border border-border p-4">
    <div className="flex items-center justify-between"><p className="font-medium">Knoppen</p>{value && <ResetLink onClick={() => onChange(undefined)} />}</div>
    <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Field label="Soort"><select className={sel} value={v.variant ?? ""} onChange={(e) => set({ variant: (e.target.value || undefined) as ButtonStyle["variant"] })}><option value="">Standaard</option><option value="filled">Gevuld</option><option value="outline">Omlijnd</option><option value="ghost">Alleen tekst</option></select></Field>
      {n("size", "Tekstgrootte (px)", 8, 40)}
      <Field label="Dikte"><select className={sel} value={v.weight ?? ""} onChange={(e) => set({ weight: num(e.target.value) })}><option value="">Standaard</option>{[300, 400, 500, 600, 700, 800].map((w) => <option key={w} value={w}>{w}</option>)}</select></Field>
      {n("radius", "Afronding (px)", 0, 999)}{n("px", "Ruimte links/rechts", 0, 80)}{n("py", "Ruimte boven/onder", 0, 40)}
    </div>
    <div className="grid gap-3 md:grid-cols-3">
      <Field label="Achtergrond"><ColorField value={v.bg} onChange={(bg) => set({ bg })} /></Field>
      <Field label="Tekstkleur"><ColorField value={v.color} onChange={(color) => set({ color })} /></Field>
      <Field label="Randkleur"><ColorField value={v.border} onChange={(border) => set({ border })} /></Field>
    </div>
  </div>;
}

function SpacingRow({ label, value, onChange, max }: { label: string; value: ResponsiveNumber | undefined; onChange: (v: ResponsiveNumber | undefined) => void; max: number }) {
  return <div className="space-y-2 rounded-sm border border-border p-4">
    <div className="flex flex-wrap items-center gap-1.5"><span className="mr-2 text-sm font-medium">{label}</span>
      {SPACE_PRESETS.map(([l, px]) => <Button key={l} type="button" size="sm" variant={value?.desktop === px && value.mobile === undefined ? "default" : "outline"} onClick={() => onChange({ desktop: px })}>{l}</Button>)}
    </div>
    <ResponsiveNumberField label="Precies (px)" unit="px" min={0} max={max} value={value} onChange={onChange} />
  </div>;
}

export function SectionEditor({ def, value, onChange, version }: { def: SectionDef; value: SectionConfig; onChange: (v: SectionConfig) => void; version: number }) {
  const set = (patch: Partial<SectionConfig>) => onChange({ ...value, ...patch });
  const content = value.content ?? {};
  const setContent = (k: string, v: string | undefined) => { const c = { ...content }; if (v === undefined) delete c[k]; else c[k] = v; set({ content: c }); };
  const media = value.media ?? {};
  const setMedia = (k: string, patch: Record<string, unknown> | undefined) => { const m = { ...media }; if (!patch) delete m[k]; else m[k] = { ...m[k], ...patch }; set({ media: m }); };
  const hasContent = !!def.content?.length || !!def.contentLink;
  return <Tabs defaultValue={hasContent ? "content" : def.media?.length ? "media" : "style"} key={def.id}>
    <TabsList className="flex h-auto flex-wrap">
      {hasContent && <TabsTrigger value="content">Inhoud</TabsTrigger>}
      {!!def.media?.length && <TabsTrigger value="media">Afbeeldingen</TabsTrigger>}
      <TabsTrigger value="style">Tekststijl & kleuren</TabsTrigger>
      {(def.spacing || !!def.extras?.length) && <TabsTrigger value="spacing">Ruimte & maten</TabsTrigger>}
      <TabsTrigger value="visibility">Zichtbaarheid</TabsTrigger>
    </TabsList>

    {hasContent && <TabsContent value="content" className="space-y-4 pt-4">
      {def.contentLink && <div className="flex flex-wrap items-center justify-between gap-2 rounded-sm bg-muted p-3 text-sm"><span>{def.contentLink.label} pas je aan op een eigen beheerpagina.</span><Button asChild size="sm" variant="outline"><Link to={def.contentLink.to}>Openen</Link></Button></div>}
      {def.content?.map((f) => {
        const ov = content[f.key];
        const val = ov ?? f.default;
        const reset = () => setContent(f.key, undefined);
        return <Field key={f.key} label={f.label} changed={ov !== undefined} onReset={reset}>
          {f.type === "text" || f.type === "url" ? <Input value={val} placeholder={f.type === "url" ? "/collections/golf of https://…" : ""} onChange={(e) => setContent(f.key, e.target.value)} />
            : f.type === "textarea" ? <Textarea rows={3} value={val} onChange={(e) => setContent(f.key, e.target.value)} />
            : f.type === "rich" ? <RichTextEditor key={`${f.key}-${version}-${ov === undefined}`} value={val} onChange={(h) => setContent(f.key, h)} />
            : f.type === "select" ? <select className={sel} value={val} onChange={(e) => setContent(f.key, e.target.value)}>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
            : <ColorField value={val || undefined} onChange={(c) => setContent(f.key, c)} />}
        </Field>;
      })}
    </TabsContent>}

    {!!def.media?.length && <TabsContent value="media" className="grid gap-4 pt-4 md:grid-cols-2">
      {def.media.map((f) => {
        const ov = media[f.key];
        const cur = { url: ov?.url ?? f.default, alt: ov?.alt ?? f.alt, position: ov?.position ?? "center" };
        return <div key={f.key} className="space-y-3 rounded-sm border border-border p-4">
          <div className="flex items-center justify-between"><p className="font-medium">{f.label}</p>{ov && <ResetLink onClick={() => setMedia(f.key, undefined)} />}</div>
          {cur.url && <img src={cur.url} alt="" className="h-40 w-full rounded-sm bg-muted object-cover" style={{ objectPosition: cur.position }} />}
          <MediaField kind={f.kind} value={ov?.url ?? ""} placeholder="Leeg = standaardfoto" onChange={(u) => setMedia(f.key, { url: u || undefined })} />
          <Field label="Omschrijving (voor zoekmachines en schermlezers)"><Input value={cur.alt} onChange={(e) => setMedia(f.key, { alt: e.target.value })} /></Field>
          <Field label="Focuspunt"><select className={sel} value={cur.position} onChange={(e) => setMedia(f.key, { position: e.target.value })}>{Object.entries(POS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
        </div>;
      })}
    </TabsContent>}

    <TabsContent value="style" className="space-y-4 pt-4">
      {def.background && <BackgroundEditor image={def.backgroundImage} value={value.background} onChange={(background) => set({ background })} />}
      {def.buttons && <ButtonEditor value={value.button} onChange={(button) => set({ button })} />}
      {def.roles.filter((r) => r !== "button" || !def.buttons).map((r) => <TypographyEditor key={r} role={r} value={value.typography?.[r]} onChange={(t) => { const ty = { ...value.typography }; if (t) ty[r] = t; else delete ty[r]; set({ typography: ty }); }} />)}
    </TabsContent>

    {(def.spacing || !!def.extras?.length) && <TabsContent value="spacing" className="space-y-4 pt-4">
      {def.spacing && <>
        <SpacingRow label="Ruimte boven" max={400} value={value.spacing?.top} onChange={(top) => set({ spacing: { ...value.spacing, top } })} />
        <SpacingRow label="Ruimte onder" max={400} value={value.spacing?.bottom} onChange={(bottom) => set({ spacing: { ...value.spacing, bottom } })} />
        <div className="rounded-sm border border-border p-4"><ResponsiveNumberField label="Ruimte links en rechts" unit="px" min={0} max={200} value={value.spacing?.x} onChange={(x) => set({ spacing: { ...value.spacing, x } })} /></div>
      </>}
      {def.extras?.map((e) => {
        const cur = value.extra?.[e.key];
        const setEx = (v: ResponsiveNumber | undefined) => { const ex = { ...value.extra }; if (v) ex[e.key] = v; else delete ex[e.key]; set({ extra: ex }); };
        return <div key={e.key} className="rounded-sm border border-border p-4">{e.responsive
          ? <ResponsiveNumberField label={e.label} unit={e.unit} min={e.min} max={e.max} step={e.step} value={cur} onChange={setEx} />
          : <Field label={`${e.label}${e.default !== undefined ? ` (standaard ${e.default})` : ""}`} changed={!!cur} onReset={() => setEx(undefined)}><Input type="number" min={e.min} max={e.max} step={e.step ?? 1} value={cur?.desktop ?? ""} placeholder={e.default !== undefined ? String(e.default) : "Standaard"} onChange={(ev) => { const v = num(ev.target.value); setEx(v === undefined ? undefined : { desktop: v }); }} /></Field>}</div>;
      })}
    </TabsContent>}

    <TabsContent value="visibility" className="space-y-3 pt-4">
      <label className="flex items-center gap-3 text-sm"><Switch checked={value.visible !== false} onCheckedChange={(c) => set({ visible: c ? undefined : false })} />Sectie tonen</label>
      <label className="flex items-center gap-3 text-sm"><Switch checked={!value.hideDesktop} onCheckedChange={(c) => set({ hideDesktop: c ? undefined : true })} />Tonen op desktop</label>
      <label className="flex items-center gap-3 text-sm"><Switch checked={!value.hideMobile} onCheckedChange={(c) => set({ hideMobile: c ? undefined : true })} />Tonen op mobiel</label>
    </TabsContent>
  </Tabs>;
}

export function ViewPageLink({ to }: { to: string }) {
  return <Button asChild variant="outline"><a href={to} target="_blank" rel="noreferrer"><ExternalLink /> Bekijk pagina</a></Button>;
}
