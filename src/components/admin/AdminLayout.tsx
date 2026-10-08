import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Package, Layers, Tag, Upload, LogOut, ExternalLink, Menu, Images, FileText, MessageSquare, Trophy, Truck, Users, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";

type NavItem = { to: string; label: string; icon: LucideIcon; exact?: boolean };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    label: "Verkoop",
    items: [
      { to: "/admin/orders", label: "Bestellingen", icon: Package },
      { to: "/admin/submissions", label: "Inzendingen", icon: MessageSquare },
      { to: "/admin/customers", label: "Klanten", icon: Users },
      { to: "/admin/products", label: "Producten", icon: Package },
      { to: "/admin/collections", label: "Collecties", icon: Layers },
      { to: "/admin/sports", label: "Sporten", icon: Trophy },
      { to: "/admin/discounts", label: "Acties", icon: Tag },
    ],
  },
  {
    label: "Website",
    items: [
      { to: "/admin/pages", label: "Pagina's", icon: FileText },
      { to: "/admin/menu", label: "Menu", icon: Menu },
      { to: "/admin/media", label: "Mediabibliotheek", icon: Images },
    ],
  },
  {
    label: "Communicatie",
    items: [
      { to: "/admin/emails", label: "E-mails", icon: MessageSquare },
      { to: "/admin/contact", label: "FAQ", icon: MessageSquare },
    ],
  },
  {
    label: "Instellingen",
    items: [
      { to: "/admin/shipping", label: "Verzending", icon: Truck },
      { to: "/admin/import", label: "Importeren", icon: Upload },
    ],
  },
];

const overview: NavItem = { to: "/admin", label: "Overzicht", icon: LayoutDashboard, exact: true };

function NavLink({ i, className }: { i: NavItem; className?: string }) {
  return (
    <Link to={i.to as never} activeOptions={{ exact: !!i.exact }}
      className={className ?? "flex items-center gap-3 rounded-sm px-3 py-2 opacity-80 hover:bg-primary-foreground/10 hover:opacity-100"}
      activeProps={{ className: "bg-primary-foreground/15 opacity-100" }}>
      <i.icon className="h-4 w-4" /> {i.label}
    </Link>
  );
}

export function AdminLayout({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  const nav = useNavigate();
  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
      return !!data;
    },
  });

  return (
    <div className="flex min-h-screen bg-muted/40">
      <aside className="hidden w-60 shrink-0 flex-col bg-primary p-5 text-primary-foreground md:flex">
        <Logo variant="white" className="h-6" />
        <p className="mt-1 text-xs opacity-70">Beheer</p>
        <nav className="mt-6 flex flex-1 flex-col gap-1 overflow-y-auto text-sm">
          <NavLink i={overview} />
          {groups.map((g) => (
            <div key={g.label} className="mt-4">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider opacity-50">{g.label}</p>
              <div className="flex flex-col gap-1">
                {g.items.map((i) => <NavLink key={i.to} i={i} />)}
              </div>
            </div>
          ))}
        </nav>
        <a href="/" target="_blank" className="flex items-center gap-3 px-3 py-2 text-sm opacity-80 hover:opacity-100"><ExternalLink className="h-4 w-4" /> Bekijk shop</a>
        <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth" }); }} className="flex items-center gap-3 px-3 py-2 text-sm opacity-80 hover:opacity-100">
          <LogOut className="h-4 w-4" /> Uitloggen
        </button>
      </aside>
      <div className="flex-1">
        <nav className="flex gap-4 overflow-x-auto bg-primary px-4 py-3 text-sm text-primary-foreground md:hidden">
          <Link to="/admin">Overzicht</Link>
          {groups.flatMap((g) => g.items).map((i) => <Link key={i.to} to={i.to as never}>{i.label}</Link>)}
        </nav>
        <div className="mx-auto max-w-6xl p-4 md:p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-extrabold">{title}</h1>
            {actions}
          </div>
          {isLoading ? <p className="text-muted-foreground">Laden…</p> : isAdmin ? children : (
            <div className="rounded-sm bg-card p-8 text-center">
              <p className="font-medium">Geen toegang</p>
              <p className="mt-1 text-sm text-muted-foreground">Dit account heeft geen beheerrechten.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
