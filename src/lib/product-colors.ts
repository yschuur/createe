const colorTokens: Record<string, string> = {
  antraciet: "anthracite", beige: "sand", "leaf-green": "leaf", "luxe-white": "white",
  navy: "navy", "oceaan-blauw": "ocean", "off-white": "offwhite", sand: "sand",
  vanille: "vanilla", zwart: "black", wit: "white", black: "black", white: "white",
};

/**
 * Colors that share one swatch in the shop filter. The first name is the one shown
 * in the menu and stored in the URL; clicking the swatch matches every name in the row.
 */
const COLOR_GROUPS: string[][] = [
  ["beige", "sand"],
  ["navy", "oceaan-blauw"],
];

export function normalizeColorName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "-");
}

const groupByColor = new Map<string, string[]>();
for (const group of COLOR_GROUPS) {
  const members = group.map(normalizeColorName);
  for (const member of members) groupByColor.set(member, members);
}

/** The name a color's shared swatch is filed under: the first of its group, else the color itself. */
export function colorGroupKey(value: string) {
  const key = normalizeColorName(value);
  return groupByColor.get(key)?.[0] ?? key;
}

/** Every color name the shared swatch stands for. */
export function colorsInGroup(value: string) {
  const key = normalizeColorName(value);
  return groupByColor.get(key) ?? [key];
}

/** Tooltip text for a shared swatch, e.g. "beige / sand". */
export function colorGroupLabel(value: string) {
  const members = groupByColor.get(normalizeColorName(value));
  return members ? members.join(" / ") : value.trim();
}

export function productColor(value: string) {
  const key = normalizeColorName(value);
  return `var(--product-color-${colorTokens[key] ?? "unknown"})`;
}
