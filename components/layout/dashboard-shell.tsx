"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Archive, BarChart3, Bell, Building2, ClipboardList, CreditCard, FileText, Hammer, Home, LayoutDashboard, LifeBuoy, LogOut, Search, Settings, Shield, UserCircle, UserCog, Users, Wrench } from "lucide-react";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { PERMISSIONS } from "@/constants/permissions";
import { can } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/brand-logo";
import { countUnreadNotifications } from "@/services/notifications";
import { useEffect, useState } from "react";

const nav = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard, permission: null },
  { href: "/biens", label: "Biens", icon: Home, permission: PERMISSIONS.PROPERTIES_READ },
  { href: "/locataires", label: "Locataires", icon: Users, permission: PERMISSIONS.TENANTS_READ },
  { href: "/contrats", label: "Contrats", icon: FileText, permission: PERMISSIONS.CONTRACTS_READ },
  { href: "/paiements", label: "Paiements", icon: CreditCard, permission: PERMISSIONS.PAYMENTS_MANAGE },
  { href: "/rapports", label: "Rapports", icon: BarChart3, permission: PERMISSIONS.PAYMENTS_READ },
  { href: "/notifications", label: "Notifications", icon: Bell, permission: PERMISSIONS.NOTIFICATIONS_VIEW },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, permission: PERMISSIONS.MAINTENANCE_MANAGE },
  { href: "/prestataires", label: "Prestataires", icon: UserCog, permission: PERMISSIONS.MAINTENANCE_MANAGE },
  { href: "/interventions", label: "Interventions", icon: Hammer, permission: PERMISSIONS.MAINTENANCE_MANAGE },
  { href: "/documents", label: "Documents", icon: Building2, permission: PERMISSIONS.DOCUMENTS_MANAGE },
  { href: "/profil", label: "Profil", icon: UserCircle, permission: null },
  { href: "/organisation", label: "Organisation", icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
  { href: "/admin", label: "Admin SaaS", icon: Shield, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/organizations", label: "Organisations", icon: Building2, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/platform", label: "Plateforme", icon: BarChart3, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/search", label: "Recherche", icon: Search, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/support", label: "Support", icon: LifeBuoy, permission: PERMISSIONS.ADMIN_ACCESS },
  { href: "/admin/archives", label: "Archives", icon: Archive, permission: PERMISSIONS.ARCHIVES_MANAGE },
  { href: "/admin/logs", label: "Journal", icon: ClipboardList, permission: PERMISSIONS.LOGS_READ }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, organization, member } = useAuth();
  const permissions = member?.permissions ?? [];
  const [unreadNotifications, setUnreadNotifications] = useState(0);
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

  async function handleLogout() {
    await signOut(auth);
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-white text-sobaya-ink">
      <aside className="fixed bottom-0 left-0 right-0 z-20 border-t border-sobaya-border bg-white/95 backdrop-blur lg:bottom-auto lg:right-auto lg:top-0 lg:flex lg:h-screen lg:w-64 lg:flex-col lg:border-r lg:border-t-0">
        <div className="hidden px-6 py-6 lg:block">
          <BrandLogo priority />
          <p className="mt-3 text-xs text-sobaya-muted">{organization?.name ?? "Organisation"}</p>
          <p className="mt-3 inline-flex rounded-full border border-sobaya-border px-3 py-1 text-xs text-sobaya-muted">{member?.role ?? "membre"}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 py-2 lg:flex-1 lg:flex-col lg:gap-1 lg:px-4">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "flex min-w-[56px] items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm transition sm:min-w-fit lg:justify-start",
                  active ? "bg-sobaya-soft text-sobaya-ink" : "text-sobaya-muted hover:bg-sobaya-soft hover:text-sobaya-ink"
                )}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{item.label}</span>{item.href === "/notifications" && unreadNotifications > 0 ? <span className="ml-auto rounded-full bg-sobaya-primary px-2 py-0.5 text-[10px] font-semibold text-white">{unreadNotifications}</span> : null}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-sobaya-border p-4 lg:block">
          <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-3 text-sm text-sobaya-muted transition hover:bg-sobaya-soft hover:text-sobaya-ink">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="pb-24 lg:ml-64 lg:pb-0">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-5 sm:py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
