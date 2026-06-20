"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase/client";
import { getOrganization, getOrganizationMember } from "@/services/organizations";
import type { Organization, OrganizationMember } from "@/types/organization";
import type { UserProfile } from "@/types/user";

type AuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  organization: Organization | null;
  member: OrganizationMember | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [member, setMember] = useState<OrganizationMember | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSession(user: User | null) {
    setFirebaseUser(user);
    setProfile(null);
    setOrganization(null);
    setMember(null);

    if (!user) {
      setLoading(false);
      return;
    }

    const profileSnapshot = await getDoc(doc(db, "users", user.uid));
    if (!profileSnapshot.exists()) {
      setLoading(false);
      return;
    }

    const userProfile = { uid: user.uid, ...profileSnapshot.data() } as UserProfile;
    setProfile(userProfile);

    if (userProfile.activeOrganizationId) {
      const [activeOrganization, activeMember] = await Promise.all([
        getOrganization(userProfile.activeOrganizationId),
        getOrganizationMember(userProfile.activeOrganizationId, user.uid)
      ]);
      setOrganization(activeOrganization);
      setMember(activeMember);
    }

    setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      loadSession(user).catch(() => setLoading(false));
    });
    return () => unsubscribe();
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      organization,
      member,
      loading,
      refreshSession: async () => {
        setLoading(true);
        await loadSession(auth.currentUser);
      }
    }),
    [firebaseUser, profile, organization, member, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
