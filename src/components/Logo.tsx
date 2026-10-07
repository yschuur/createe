import white from "@/assets/logo_golf_wit.png.asset.json";
import green from "@/assets/logo_golf_groen.png.asset.json";
import mark from "@/assets/createe_logo_favicon.png.asset.json";
import { cn } from "@/lib/utils";

type Variant = "white" | "green" | "favicon";

/**
 * Official CREATEE brand assets. Pick by background:
 * - "white" on dark/green surfaces, "green" on light surfaces, "favicon" for compact marks.
 * Or pass `background="dark" | "light"` and the right wordmark is chosen.
 * Always scales proportionally (set height only).
 */
export function Logo({
  variant,
  background,
  className,
}: {
  variant?: Variant;
  background?: "dark" | "light";
  className?: string;
}) {
  const v: Variant = variant ?? (background === "dark" ? "white" : "green");
  if (v === "favicon") {
    return <img src={mark.url} alt="CREATEE" className={cn("h-10 w-auto aspect-square object-contain", className)} />;
  }
  return (
    <img
      src={v === "white" ? white.url : green.url}
      alt="CREATEE"
      width={517}
      height={78}
      className={cn("h-6 w-auto object-contain md:h-7", className)}
    />
  );
}
