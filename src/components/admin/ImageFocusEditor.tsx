import { useRef, useState, type PointerEvent } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { dragFocus, focusPosition, type ImageFocus } from "@/lib/image-focus";

export function ImageFocusEditor({ url, value, onChange }: { url: string; value: ImageFocus; onChange: (focus: ImageFocus) => void }) {
  const image = useRef<HTMLImageElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; focus: ImageFocus; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const start = (e: PointerEvent<HTMLDivElement>) => {
    const img = image.current;
    if (!img?.naturalWidth || e.button !== 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = Math.max(rect.width / img.naturalWidth, rect.height / img.naturalHeight);
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, focus: value, ox: img.naturalWidth * scale - rect.width, oy: img.naturalHeight * scale - rect.height };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const end = () => { gesture.current = null; setDragging(false); };
  return <div className="space-y-2">
    <div role="group" aria-label="Afbeeldingsuitsnede" tabIndex={0}
      className={`relative aspect-[4/3] w-full touch-none overflow-hidden rounded-sm bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
      onPointerDown={start} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end}
      onPointerMove={(e) => { const g = gesture.current; if (g && g.id === e.pointerId) onChange(dragFocus(g.focus, e.clientX - g.x, e.clientY - g.y, g.ox, g.oy)); }}
      onKeyDown={(e) => { const delta: Record<string, [number, number]> = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }; const d = delta[e.key]; if (d) { e.preventDefault(); onChange({ x: Math.max(0, Math.min(100, value.x + d[0])), y: Math.max(0, Math.min(100, value.y + d[1])) }); } }}>
      <img ref={image} src={url} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover" style={{ objectPosition: focusPosition(value) }} />
    </div>
    <Button type="button" variant="ghost" size="sm" onClick={() => onChange({ x: 50, y: 50 })}><RotateCcw className="size-3.5" />Uitsnede centreren</Button>
  </div>;
}