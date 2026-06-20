"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Archive, BarChart3, Bell, Building2, ClipboardList, CreditCard, FileText, Hammer, Home, LayoutDashboard, LifeBuoy, LogOut, Menu, Search, Settings, Shield, UserCircle, UserCog, Users, Wrench, X } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { PERMISSIONS } from "@/constants/permissions";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { countUnreadNotifications } from "@/services/notifications";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, permission: null },
  { href: "/biens", label: "Biens", icon: Home, permission: PERMISSIONS.PROPERTIES_READ },
  { href: "/locataires", label: "Locataires", icon: Users, permission: PERMISSIONS.TENANTS_READ },
  { href: "/contrats", label: "Contrats", icon: FileText, permission: PERMISSIONS.CONTRACTS_READ },
  { href: "/paiements", label: "Paiements", icon: CreditCard, permission: PERMISSIONS.PAYMENTS_MANAGE },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, permission: PERMISSIONS.MAINTENANCE_MANAGE },
  { href: "/prestataires", label: "Prestataires", icon: UserCog, permission: PERMISSIONS.MAINTENANCE_MANAGE },
  { href: "/interventions", label: "Interventions", icon: Hammer, permission: PERMISSIONS.MAINTENANCE_MANAGE },
  { href: "/rapports", label: "Rapports", icon: BarChart3, permission: PERMISSIONS.PAYMENTS_READ },
  { href: "/notifications", label: "Notifications", icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { href: "/documents", label: "Documents", icon: Building2, permission: PERMISSIONS.DOCUMENTS_MANAGE },
  { href: "/admin", label: "Administration", icon: Shield, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/organizations", label: "Organisations", icon: Building2, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/platform", label: "Plateforme", icon: BarChart3, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/search", label: "Recherche", icon: Search, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/archives", label: "Archives", icon: Archive, permission: PERMISSIONS.ARCHIVES_MANAGE },
  { href: "/admin/logs", label: "Journal", icon: ClipboardList, permission: PERMISSIONS.LOGS_READ },
  { href: "/organisation", label: "Paramètres", icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
  { href: "/profil", label: "Profil", icon: UserCircle, permission: null }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, organization, member } = useAuth();
  const permissions = member?.permissions ?? [];
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const visibleNav = nav.filter((item) => !item.permission || can(permissions, item.permission) || profile?.globalRole === "super_admin");

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

  function NavLink({ item, mobile = false }: { item: (typeof nav)[number]; mobile?: boolean }) {
    const Icon = item.icon;
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-label={item.label}
        title={item.label}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition",
          mobile ? "justify-start" : "justify-start",
          active ? "bg-sobaya-soft text-sobaya-ink" : "text-sobaya-muted hover:bg-sobaya-soft hover:text-sobaya-ink"
        )}
      >
        <Icon size={18} />
        <span>{item.label}</span>
        {item.href === "/notifications" && unreadNotifications > 0 ? <span className="ml-auto rounded-full bg-sobaya-primary px-2 py-0.5 text-[10px] font-semibold text-white">{unreadNotifications}</span> : null}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-white text-sobaya-ink">
      <header className="sticky top-0 z-30 border-b border-sobaya-border bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <BrandLogo priority />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sobaya-border bg-white text-sobaya-ink shadow-sm"
            aria-label="Ouvrir le menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-sobaya-ink/35" aria-label="Fermer le menu" onClick={() => setMobileMenuOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-sobaya-border px-5 py-5">
              <div>
                <BrandLogo priority />
                <p className="mt-3 text-xs text-sobaya-muted">{organization?.name ?? "Organisation"}</p>
                <p className="mt-2 inline-flex rounded-full border border-sobaya-border px-3 py-1 text-xs text-sobaya-muted">{member?.role ?? "membre"}</p>
              </div>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-sobaya-border" aria-label="Fermer le menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
              {visibleNav.map((item) => <NavLink key={item.href} item={item} mobile />)}
            </nav>
            <div className="border-t border-sobaya-border p-4">
              <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-red-700 transition hover:bg-red-50">
                <LogOut size={18} /> Déconnexion
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 flex-col border-r border-sobaya-border bg-white/95 backdrop-blur lg:flex">
        <div className="px-6 py-6">
          <BrandLogo priority />
          <p className="mt-3 text-xs text-sobaya-muted">{organization?.name ?? "Organisation"}</p>
          <p className="mt-3 inline-flex rounded-full border border-sobaya-border px-3 py-1 text-xs text-sobaya-muted">{member?.role ?? "membre"}</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4">
          {visibleNav.map((item) => <NavLink key={item.href} item={item} />)}
        </nav>
        <div className="border-t border-sobaya-border p-4">
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-sobaya-muted transition hover:bg-sobaya-soft hover:text-sobaya-ink">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="lg:ml-64">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-5 sm:py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
