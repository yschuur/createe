export type ImageFocus = { x: number; y: number };
export function legacyFocus(position?: string): ImageFocus {
  return { x: position === "left" ? 0 : position === "right" ? 100 : 50, y: position === "top" ? 0 : position === "bottom" ? 100 : 50 };
}
export function focusPosition(focus: ImageFocus): string { return `${focus.x}% ${focus.y}%`; }
export function dragFocus(start: ImageFocus, dx: number, dy: number, overflowX: number, overflowY: number): ImageFocus {
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(100, n)) * 100) / 100;
  return { x: overflowX > 0 ? clamp(start.x - dx / overflowX * 100) : start.x, y: overflowY > 0 ? clamp(start.y - dy / overflowY * 100) : start.y };
}