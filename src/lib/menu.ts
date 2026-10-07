import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MenuItem = { label: string; link: string; children: MenuItem[] };

export const defaultMenu: MenuItem[] = [
  { label: "Home", link: "/", children: [] },
  { label: "Golf", link: "/collections/golf", children: [] },
  { label: "Padel", link: "/collections/padel", children: [] },
  { label: "Studio", link: "/design-studio", children: [] },
  { label: "Over ons", link: "/pages/ons-verhaal", children: [] },
];

export const menuQuery = () => queryOptions({
  queryKey: ["site-settings", "menu"],
  queryFn: async (): Promise<MenuItem[]> => {
    const { data } = await supabase.from("site_settings").select("value").eq("key", "menu").maybeSingle();
    const items = (data?.value as { items?: MenuItem[] } | null)?.items;
    return items?.length ? items : defaultMenu;
  },
  staleTime: 60_000,
});
