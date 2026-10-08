import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { defaultPolicyContent } from "@/lib/policies-defaults";

export const POLICY_SLUGS = ["privacy-policy", "terms-of-service", "refund-policy", "shipping-policy"] as const;
export type PolicySlug = (typeof POLICY_SLUGS)[number];

const policySchema = z.object({ label: z.string().min(1).max(200), title: z.string().min(1).max(2000), body: z.string().max(200000) });
export const policiesSchema = z.object(Object.fromEntries(POLICY_SLUGS.map((s) => [s, policySchema])) as Record<PolicySlug, typeof policySchema>);
export type Policies = z.infer<typeof policiesSchema>;
export type Policy = Policies[PolicySlug];

export const defaultPolicies: Policies = JSON.parse(JSON.stringify(defaultPolicyContent));

export const isPolicySlug = (s: string): s is PolicySlug => (POLICY_SLUGS as readonly string[]).includes(s);

export const policiesQuery = () => queryOptions({
  queryKey: ["site-settings", "policies"],
  queryFn: async (): Promise<Policies> => {
    const { data, error } = await supabase.from("site_settings").select("value").eq("key", "policies").maybeSingle();
    if (error) throw new Error("Beleidspagina's konden niet worden geladen.");
    const merged = { ...defaultPolicies, ...((data?.value as object) ?? {}) };
    const parsed = policiesSchema.safeParse(merged);
    return parsed.success ? parsed.data : defaultPolicies;
  }, staleTime: 60000,
});
