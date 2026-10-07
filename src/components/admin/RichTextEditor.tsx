import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle, FontFamily, FontSize, Color } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, Italic, Link2, List, ListOrdered, Quote, RemoveFormatting, Strikethrough, Underline } from "lucide-react";

const FONTS = [
  { label: "Standaard", value: "" },
  { label: "Jost", value: "Jost, sans-serif" },
  { label: "Fraunces", value: "Fraunces, serif" },
  { label: "Montserrat", value: "Montserrat, sans-serif" },
];
const SIZES = ["", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "40px", "48px"];
const COLORS = [
  { label: "Groen", value: "#275C38" },
  { label: "Donker", value: "#1A1A1A" },
  { label: "Grijs", value: "#6B6B6B" },
  { label: "Wit", value: "#FFFFFF" },
  { label: "Rood", value: "#C0392B" },
];

/** Standaard tekstveld voor langere teksten: volledige opmaak, slaat HTML op. */
export function RichTextEditor({ value, onChange, placeholder, minHeight = 120 }: { value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
      TextStyle, FontFamily, FontSize, Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value || "",
    editorProps: { attributes: { class: "prose-shop max-w-none px-3 py-2 text-sm focus:outline-none", style: `min-height:${minHeight}px`, ...(placeholder ? { "data-placeholder": placeholder } : {}) } },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML() && !(value === "" && editor.isEmpty)) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [value, editor]);

  const st = useEditorState({
    editor,
    selector: ({ editor: e }) => e ? {
      bold: e.isActive("bold"), italic: e.isActive("italic"), underline: e.isActive("underline"), strike: e.isActive("strike"),
      bullet: e.isActive("bulletList"), ordered: e.isActive("orderedList"), quote: e.isActive("blockquote"), link: e.isActive("link"),
      font: (e.getAttributes("textStyle")["fontFamily"] as string) ?? "", size: (e.getAttributes("textStyle")["fontSize"] as string) ?? "",
      color: (e.getAttributes("textStyle")["color"] as string) ?? "",
      block: e.isActive("heading", { level: 2 }) ? "h2" : e.isActive("heading", { level: 3 }) ? "h3" : e.isActive("heading", { level: 4 }) ? "h4" : "p",
      align: (["center", "right", "justify"].find((a) => e.isActive({ textAlign: a })) ?? "left"),
    } : null,
  });
  if (!editor || !st) return <div className="rounded-sm border border-input bg-background" style={{ minHeight: minHeight + 40 }} />;
  const c = () => editor.chain().focus();
  const btn = (active: boolean, label: string, onClick: () => void, Icon: typeof Bold) =>
    <button type="button" title={label} aria-label={label} aria-pressed={active} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={`grid size-7 place-items-center rounded-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}><Icon className="size-4" /></button>;
  const sel = "h-7 rounded-sm border border-input bg-background px-1 text-xs";

  return <div className="rounded-sm border border-input bg-background">
    <div className="flex flex-wrap items-center gap-1 border-b border-input p-1">
      <select className={sel} aria-label="Tekststijl" value={st.block} onChange={(e) => { const v = e.target.value; if (v === "p") c().setParagraph().run(); else c().setHeading({ level: Number(v[1]) as 2 | 3 | 4 }).run(); }}>
        <option value="p">Tekst</option><option value="h2">Kop groot</option><option value="h3">Kop middel</option><option value="h4">Kop klein</option>
      </select>
      <select className={sel} aria-label="Lettertype" value={st.font} onChange={(e) => e.target.value ? c().setFontFamily(e.target.value).run() : c().unsetFontFamily().run()}>
        {FONTS.map((f) => <option key={f.label} value={f.value}>{f.label}</option>)}
      </select>
      <select className={sel} aria-label="Grootte" value={st.size} onChange={(e) => e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run()}>
        {SIZES.map((s) => <option key={s} value={s}>{s ? s.replace("px", "") : "Grootte"}</option>)}
      </select>
      <span className="mx-1 h-5 w-px bg-border" />
      {btn(st.bold, "Vet", () => c().toggleBold().run(), Bold)}
      {btn(st.italic, "Cursief", () => c().toggleItalic().run(), Italic)}
      {btn(st.underline, "Onderstrepen", () => c().toggleUnderline().run(), Underline)}
      {btn(st.strike, "Doorhalen", () => c().toggleStrike().run(), Strikethrough)}
      <span className="mx-1 h-5 w-px bg-border" />
      {COLORS.map((col) => <button key={col.value} type="button" title={col.label} aria-label={`Kleur ${col.label}`} onMouseDown={(e) => e.preventDefault()} onClick={() => c().setColor(col.value).run()}
        className={`size-5 rounded-full border ${st.color.toLowerCase() === col.value.toLowerCase() ? "ring-2 ring-primary ring-offset-1" : "border-border"}`} style={{ background: col.value }} />)}
      <label title="Eigen kleur" className="relative size-5 cursor-pointer overflow-hidden rounded-full border border-border" style={{ background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }}>
        <input type="color" className="absolute inset-0 opacity-0" value={st.color.startsWith("#") && st.color.length === 7 ? st.color : "#275c38"} onChange={(e) => c().setColor(e.target.value).run()} />
      </label>
      <span className="mx-1 h-5 w-px bg-border" />
      {btn(st.align === "left", "Links uitlijnen", () => c().setTextAlign("left").run(), AlignLeft)}
      {btn(st.align === "center", "Centreren", () => c().setTextAlign("center").run(), AlignCenter)}
      {btn(st.align === "right", "Rechts uitlijnen", () => c().setTextAlign("right").run(), AlignRight)}
      {btn(st.align === "justify", "Uitvullen", () => c().setTextAlign("justify").run(), AlignJustify)}
      <span className="mx-1 h-5 w-px bg-border" />
      {btn(st.bullet, "Opsomming", () => c().toggleBulletList().run(), List)}
      {btn(st.ordered, "Nummering", () => c().toggleOrderedList().run(), ListOrdered)}
      {btn(st.quote, "Citaat", () => c().toggleBlockquote().run(), Quote)}
      {btn(st.link, "Link", () => { const prev = editor.getAttributes("link")["href"] as string | undefined; const url = window.prompt("Link (leeg = verwijderen)", prev ?? "https://"); if (url === null) return; if (!url) c().unsetLink().run(); else c().extendMarkRange("link").setLink({ href: url }).run(); }, Link2)}
      {btn(false, "Opmaak wissen", () => c().unsetAllMarks().clearNodes().run(), RemoveFormatting)}
    </div>
    <EditorContent editor={editor} />
  </div>;
}
