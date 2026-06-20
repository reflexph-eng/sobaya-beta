import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { getPermissionsForRole } from "@/lib/permissions";
import type { Organization, OrganizationMember, OrganizationType, SubscriptionPlan } from "@/types/organization";

export async function createStarterOrganization({ userId, name, email = "", displayName = "", type = "owner", subscriptionPlan = "starter" }: { userId: string; name: string; email?: string; displayName?: string; type?: OrganizationType; subscriptionPlan?: SubscriptionPlan }) {
  const organizationRef = await addDoc(collection(db, "organizations"), {
    name: name.trim(),
    type,
    subscriptionPlan,
    subscriptionStatus: "trial",
    ownerId: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  await setDoc(doc(db, "organizations", organizationRef.id, "members", userId), {
    userId,
    email,
    displayName,
    role: "owner",
    status: "active",
    permissions: getPermissionsForRole("owner"),
    joinedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return organizationRef.id;
}

export async function getOrganization(organizationId: string) {
  const snapshot = await getDoc(doc(db, "organizations", organizationId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Organization;
}

export async function getOrganizationMember(organizationId: string, userId: string) {
  const snapshot = await getDoc(doc(db, "organizations", organizationId, "members", userId));
  if (!snapshot.exists()) return null;
  return snapshot.data() as OrganizationMember;
}

export async function getUserOrganizations(userId: string) {
  const orgsSnapshot = await getDocs(query(collection(db, "organizations"), where("ownerId", "==", userId)));
  return orgsSnapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Organization));
}

export async function updateOrganizationName(organizationId: string, name: string) {
  await updateDoc(doc(db, "organizations", organizationId), {
    name: name.trim(),
    updatedAt: serverTimestamp()
  });
}
