import type { ElementType } from "react";
import { sanitizeDescription } from "@/lib/shop";

/** Rich page copy keeps semantic headings without nesting paragraphs inside them. */
export function pageTextHtml(value: string, inline = false) {
  const html = sanitizeDescription(value);
  if (!inline) return html;
  return html.replace(/<(\/?)(p|div|h[1-4]|blockquote|ul|ol|li)(\s[^>]*|)>/gi, "<$1span$3>");
}

export function PageText({ value, as: Tag = "div", className = "", inline = false }: { value: string; as?: ElementType; className?: string; inline?: boolean }) {
  return <Tag className={`cms-rich ${inline ? "cms-inline" : ""} ${className}`} dangerouslySetInnerHTML={{ __html: pageTextHtml(value, inline) }} />;
}