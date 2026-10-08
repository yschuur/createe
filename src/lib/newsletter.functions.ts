import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Public: store a newsletter email and return the chosen active newsletter code. */
export const subscribeNewsletter = createServerFn({ method: "POST" })
  .validator((data: unknown) => z.object({ email: z.string().trim().toLowerCase().email().max(255), website: z.string().max(0).optional() }).parse(data))
  .handler(async ({ data }): Promise<{ ok: true; code: string | null } | { ok: false; error: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("newsletter_subscribers").upsert({ email: data.email }, { onConflict: "email", ignoreDuplicates: true });
    if (error) return { ok: false, error: "Aanmelden mislukt. Probeer het opnieuw." };
    const { data: d } = await supabaseAdmin.from("discounts").select("*").eq("newsletter", true).eq("active", true).limit(1).maybeSingle();
    const { discountProblem } = await import("@/lib/discounts");
    const usable = d && !discountProblem({ ...d, min_order_amount: null } as never, 0);
    return { ok: true, code: usable ? d.code : null };
  });
