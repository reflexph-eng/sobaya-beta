"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, updateDoc } from "firebase/firestore";
import { Shield, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { useAuth } from "@/components/providers/auth-provider";
import { db } from "@/lib/firebase/client";
import { ASSIGNABLE_ROLES } from "@/constants/global-roles";
import { GLOBAL_ROLE_DESCRIPTIONS, GLOBAL_ROLE_LABELS } from "@/types/user";
import type { GlobalRole, UserProfile } from "@/types/user";

const ROLE_TONE: Record<GlobalRole, "neutral" | "success" | "warning" | "danger"> = {
  user: "neutral",
  support: "neutral",
  moderator: "warning",
  platform_admin: "success",
  super_admin: "danger"
};

export function GlobalRolesManager() {
  const { profile } = useAuth();
  const myRole = (profile?.globalRole ?? "user") as GlobalRole;
  const assignable = ASSIGNABLE_ROLES[myRole];

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingRoles, setPendingRoles] = useState<Record<string, GlobalRole>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, "users"), orderBy("displayName")));
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleSave(uid: string) {
    const newRole = pendingRoles[uid];
    if (!newRole) return;
    setSaving(uid);
    setError("");
    try {
      await updateDoc(doc(db, "users", uid), { globalRole: newRole });
      await refresh();
      setPendingRoles((current) => { const next = { ...current }; delete next[uid]; return next; });
    } catch {
      setError("Modification impossible. Vérifiez vos permissions super admin.");
    } finally {
      setSaving(null);
    }
  }

  const adminUsers = users.filter((u) => u.globalRole && u.globalRole !== "user");
  const regularUsers = users.filter((u) => !u.globalRole || u.globalRole === "user");

  return (
    <SuperAdminGate require="canManageGlobalRoles">
      <div className="space-y-6">
        <PageHeader
          title="Rôles globaux plateforme"
          description="Gérez les accès administrateur de vos collaborateurs SOBAYA."
        />

        {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

        {/* Légende des rôles */}
        <Card>
          <p className="mb-4 flex items-center gap-2 font-medium text-sobaya-ink"><Shield size={16} /> Niveaux d&apos;accès</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["support", "moderator", "platform_admin", "super_admin"] as GlobalRole[]).map((role) => (
              <div key={role} className="flex items-start gap-3 rounded-xl border border-sobaya-border p-3">
                <StatusBadge tone={ROLE_TONE[role]}>{GLOBAL_ROLE_LABELS[role]}</StatusBadge>
                <p className="text-xs text-sobaya-muted">{GLOBAL_ROLE_DESCRIPTIONS[role]}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Collaborateurs avec rôle admin */}
        <Card>
          <p className="mb-4 flex items-center gap-2 font-medium text-sobaya-ink">
            <UserCheck size={16} /> Collaborateurs avec accès admin ({adminUsers.length})
          </p>
          {loading ? <p className="text-sm text-sobaya-muted">Chargement...</p> : null}
          {!loading && adminUsers.length === 0 ? (
            <p className="text-sm text-sobaya-muted">Aucun collaborateur avec un rôle admin pour le moment.</p>
          ) : null}
          <div className="space-y-3">
            {adminUsers.map((user) => {
              const currentRole = (user.globalRole ?? "user") as GlobalRole;
              const pending = pendingRoles[user.uid];
              const canEdit = assignable.includes(currentRole) || myRole === "super_admin";
              return (
                <div key={user.uid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sobaya-border p-3">
                  <div>
                    <p className="font-medium text-sobaya-ink">{user.displayName}</p>
                    <p className="text-xs text-sobaya-muted">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {canEdit ? (
                      <>
                        <select
                          value={pending ?? currentRole}
                          onChange={(e) => setPendingRoles((curr) => ({ ...curr, [user.uid]: e.target.value as GlobalRole }))}
                          className="h-9 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-primary"
                        >
                          {(["user", ...assignable] as GlobalRole[]).map((role) => (
                            <option key={role} value={role}>{GLOBAL_ROLE_LABELS[role]}</option>
                          ))}
                        </select>
                        {pending && pending !== currentRole ? (
                          <Button disabled={saving === user.uid} onClick={() => handleSave(user.uid)}>
                            {saving === user.uid ? "..." : "Enregistrer"}
                          </Button>
                        ) : null}
                      </>
                    ) : (
                      <StatusBadge tone={ROLE_TONE[currentRole]}>{GLOBAL_ROLE_LABELS[currentRole]}</StatusBadge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Tous les utilisateurs — pour attribuer un rôle */}
        <Card>
          <p className="mb-4 font-medium text-sobaya-ink">
            Attribuer un rôle à un utilisateur existant ({regularUsers.length} utilisateurs standards)
          </p>
          <p className="mb-4 text-xs text-sobaya-muted">
            L&apos;utilisateur doit d&apos;abord avoir créé son compte SOBAYA. Cherchez par nom.
          </p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {regularUsers.slice(0, 50).map((user) => {
              const pending = pendingRoles[user.uid];
              return (
                <div key={user.uid} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sobaya-border p-3">
                  <div>
                    <p className="text-sm font-medium text-sobaya-ink">{user.displayName}</p>
                    <p className="text-xs text-sobaya-muted">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={pending ?? "user"}
                      onChange={(e) => setPendingRoles((curr) => ({ ...curr, [user.uid]: e.target.value as GlobalRole }))}
                      className="h-9 rounded-xl border border-sobaya-border bg-white px-3 text-sm outline-none focus:border-sobaya-primary"
                    >
                      {(["user", ...assignable] as GlobalRole[]).map((role) => (
                        <option key={role} value={role}>{GLOBAL_ROLE_LABELS[role]}</option>
                      ))}
                    </select>
                    {pending && pending !== "user" ? (
                      <Button disabled={saving === user.uid} onClick={() => handleSave(user.uid)}>
                        {saving === user.uid ? "..." : "Attribuer"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </SuperAdminGate>
  );
}
