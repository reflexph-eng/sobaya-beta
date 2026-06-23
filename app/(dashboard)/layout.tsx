import { AuthGuard } from "@/components/providers/auth-guard";
import { ModulesProvider } from "@/components/providers/modules-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ModulesProvider>
        <DashboardShell>{children}</DashboardShell>
      </ModulesProvider>
    </AuthGuard>
  );
}
