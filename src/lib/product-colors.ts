const colorTokens: Record<string, string> = {
  antraciet: "anthracite", beige: "sand", "leaf-green": "leaf", "luxe-white": "white",
  navy: "navy", "oceaan-blauw": "ocean", "off-white": "offwhite", sand: "sand",
  vanille: "vanilla", zwart: "black", wit: "white", black: "black", white: "white",
};

export function productColor(value: string) {
  const key = value.trim().toLowerCase().replace(/\s+/g, "-");
  return `var(--product-color-${colorTokens[key] ?? "unknown"})`;
}