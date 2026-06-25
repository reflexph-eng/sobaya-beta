"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { AlertTriangle, Archive, Award, BarChart3, Bell, Building2, CalendarRange, ChevronDown, ClipboardList, CreditCard, FileText, Hammer, Home, LayoutDashboard, LifeBuoy, LogOut, Megaphone, Menu, MessageSquare, Search, Settings, Shield, UserCircle, UserCog, UserRoundCheck, Users, Wrench, X } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { useModules } from "@/components/providers/modules-provider";
import { PERMISSIONS } from "@/constants/permissions";
import { getGlobalAccess } from "@/constants/global-roles";
import { can } from "@/lib/permissions";
import type { GlobalRole } from "@/types/user";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { GlobalSearch } from "@/components/layout/global-search";
import { countUnreadNotifications } from "@/services/notifications";
import { useEffect, useMemo, useState } from "react";
import type { SobayanModule } from "@/types/platform-config";

type NavItem = { href: string; label: string; icon: React.ElementType; permission: string | null; module?: SobayanModule };
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[]; defaultOpen?: boolean };

const navGroups: NavGroup[] = [
  { label: "Tableau de bord", icon: LayoutDashboard, defaultOpen: true, items: [{ href: "/dashboard", label: "Vue générale", icon: LayoutDashboard, permission: null }] },
  { label: "Gestion locative", icon: Home, defaultOpen: true, items: [
    { href: "/biens", label: "Biens", icon: Home, permission: PERMISSIONS.PROPERTIES_READ, module: "biens" },
    { href: "/proprietaires", label: "Propriétaires mandants", icon: UserRoundCheck, permission: PERMISSIONS.PROPERTIES_MANDANTS, module: "proprietaires" },
    { href: "/locataires", label: "Locataires", icon: Users, permission: PERMISSIONS.TENANTS_READ, module: "locataires" },
    { href: "/contrats", label: "Contrats", icon: FileText, permission: PERMISSIONS.CONTRACTS_READ, module: "contrats" },
    { href: "/reservations", label: "Réservations", icon: CalendarRange, permission: PERMISSIONS.BOOKINGS_READ, module: "reservations" }
  ] },
  { label: "Finances", icon: CreditCard, defaultOpen: true, items: [
    { href: "/paiements", label: "Paiements", icon: CreditCard, permission: PERMISSIONS.PAYMENTS_MANAGE, module: "paiements" },
    { href: "/impayes", label: "Impayés & relances", icon: AlertTriangle, permission: PERMISSIONS.PAYMENTS_READ, module: "impayes" },
    { href: "/rapports", label: "Rapports", icon: BarChart3, permission: PERMISSIONS.PAYMENTS_READ, module: "rapports" },
    { href: "/marketplace-leads", label: "Demandes marketplace", icon: MessageSquare, permission: PERMISSIONS.PROPERTIES_READ, module: "marketplace_leads" }
  ] },
  { label: "Exploitation", icon: Wrench, items: [
    { href: "/maintenance", label: "Maintenance", icon: Wrench, permission: PERMISSIONS.MAINTENANCE_MANAGE, module: "maintenance" },
    { href: "/prestataires", label: "Prestataires", icon: UserCog, permission: PERMISSIONS.MAINTENANCE_MANAGE, module: "prestataires" },
    { href: "/interventions", label: "Interventions", icon: Hammer, permission: PERMISSIONS.MAINTENANCE_MANAGE, module: "interventions" },
    { href: "/notifications", label: "Notifications", icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_VIEW, module: "notifications" },
    { href: "/documents", label: "Documents", icon: Building2, permission: PERMISSIONS.DOCUMENTS_MANAGE, module: "documents" }
  ] },
  { label: "Administration", icon: Shield, items: [
    { href: "/admin", label: "Administration", icon: Shield, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/organizations", label: "Organisations", icon: Building2, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/platform", label: "Plateforme", icon: BarChart3, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/settings", label: "Pilotage modules", icon: Settings, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/search", label: "Recherche admin", icon: Search, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/support", label: "Support", icon: LifeBuoy, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/pub", label: "Espaces pub", icon: Megaphone, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/about", label: "Page À propos", icon: FileText, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/badges", label: "Badges confiance", icon: Award, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/roles", label: "Rôles globaux", icon: Shield, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/archives", label: "Archives", icon: Archive, permission: PERMISSIONS.ADMIN_ACCESS },
    { href: "/admin/logs", label: "Journal", icon: ClipboardList, permission: PERMISSIONS.ADMIN_ACCESS },
  ] },
  { label: "Mon compte", icon: UserCircle, defaultOpen: true, items: [
    { href: "/organisation", label: "Paramètres", icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
    { href: "/profil", label: "Profil", icon: UserCircle, permission: null }
  ] }
];

function groupKey(label: string) {
  return label.toLowerCase().replace(/\s+/g, "-");
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, organization, member } = useAuth();
  const isSuperAdmin = profile?.globalRole === "super_admin";
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(navGroups.map((group) => [groupKey(group.label), group.defaultOpen === true])));

  const { isEnabled } = useModules();
  const globalAccess = getGlobalAccess((profile?.globalRole ?? "user") as GlobalRole);

  const visibleGroups = useMemo(() => navGroups.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      if (item.permission === PERMISSIONS.ADMIN_ACCESS && !globalAccess.canAccessAdmin) return false;
      if (item.permission && item.permission !== PERMISSIONS.ADMIN_ACCESS && !can(member?.permissions ?? [], item.permission) && !isSuperAdmin) return false;
      if (item.module && !isEnabled(item.module)) return false;
      return true;
    })
  })).filter((group) => group.items.length > 0), [member?.permissions, isSuperAdmin, isEnabled, globalAccess]);

  useEffect(() => {
    let mounted = true;
    if (!organization?.id) {
      setUnreadNotifications(0);
      return;
    }
    countUnreadNotifications(organization.id)
      .then((count) => { if (mounted) setUnreadNotifications(count); })
      .catch(() => { if (mounted) setUnreadNotifications(0); });
    return () => { mounted = false; };
  }, [organization?.id, pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  function NavLink({ item }: { item: NavItem }) {
    const Icon = item.icon;
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link href={item.href} aria-label={item.label} title={item.label} className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition", active ? "bg-sobaya-soft text-sobaya-ink" : "text-sobaya-muted hover:bg-sobaya-soft hover:text-sobaya-ink")}>
        <Icon size={17} />
        <span>{item.label}</span>
        {item.href === "/notifications" && unreadNotifications > 0 ? <span className="ml-auto rounded-full bg-sobaya-primary px-2 py-0.5 text-[10px] font-semibold text-white">{unreadNotifications}</span> : null}
      </Link>
    );
  }

  function NavContent() {
    return (
      <div className="space-y-4">
        <GlobalSearch compact />
        {visibleGroups.map((group) => {
          const key = groupKey(group.label);
          const open = openGroups[key] ?? false;
          const GroupIcon = group.icon;
          return (
            <section key={group.label} className="rounded-2xl border border-sobaya-border bg-white p-2">
              <button type="button" onClick={() => setOpenGroups((value) => ({ ...value, [key]: !open }))} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-sobaya-muted hover:bg-sobaya-soft" aria-expanded={open}>
                <GroupIcon size={15} />
                <span className="flex-1">{group.label}</span>
                <ChevronDown size={15} className={cn("transition", open ? "rotate-0" : "-rotate-90")} />
              </button>
              {open ? <div className="mt-1 space-y-1">{group.items.map((item) => <NavLink key={item.href} item={item} />)}</div> : null}
            </section>
          );
        })}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-sobaya-ink">
      <header className="sticky top-0 z-30 border-b border-sobaya-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo priority />
          <button type="button" onClick={() => setMobileMenuOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sobaya-border bg-white text-sobaya-ink shadow-sm" aria-label="Ouvrir le menu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-sobaya-ink/35" aria-label="Fermer le menu" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-[90%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-sobaya-border px-5 py-5">
              <div>
                <BrandLogo priority />
                <p className="mt-3 text-xs text-sobaya-muted">{organization?.name ?? "Organisation"}</p>
                <p className="mt-2 inline-flex rounded-full border border-sobaya-border px-3 py-1 text-xs text-sobaya-muted">{member?.role ?? "membre"}</p>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sobaya-border" aria-label="Fermer le menu"><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-4 py-4"><NavContent /></nav>
            <div className="border-t border-sobaya-border p-4"><button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-700 transition hover:bg-red-50"><LogOut size={18} /> Déconnexion</button></div>
          </aside>
        </div>
      ) : null}

      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-72 flex-col border-r border-sobaya-border bg-white/95 backdrop-blur lg:flex">
        <div className="px-6 py-6">
          <BrandLogo priority />
          <p className="mt-3 text-xs text-sobaya-muted">{organization?.name ?? "Organisation"}</p>
          <p className="mt-3 inline-flex rounded-full border border-sobaya-border px-3 py-1 text-xs text-sobaya-muted">{member?.role ?? "membre"}</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 pb-4"><NavContent /></nav>
        <div className="border-t border-sobaya-border p-4"><button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-sobaya-muted transition hover:bg-sobaya-soft hover:text-sobaya-ink"><LogOut size={18} /> Déconnexion</button></div>
      </aside>
      <main className="lg:ml-72">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-5 sm:py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
