import { notFound } from "next/navigation";
import Link from "next/link";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { PublicHeader } from "@/components/layout/public-header";
import { LegalFooter } from "@/components/layout/legal-footer";
import { AgenceVitrine } from "@/components/marketplace/agence-vitrine";
import { listPublicListingsByOrganization } from "@/services/listings";
import { listBadgesForOrganization } from "@/services/badges";
import { getActiveBadgeTypes } from "@/services/badges";
import { serializeFirestoreData } from "@/lib/serialize-firestore";
import type { Organization } from "@/types/organization";

export const dynamic = "force-dynamic";

export default async function AgencePage({ params }: { params: { orgId: string } }) {
  const orgDoc = await getDoc(doc(db, "organizations", params.orgId)).catch(() => null);
  if (!orgDoc || !orgDoc.exists()) notFound();

  const organization = { id: orgDoc.id, ...orgDoc.data() } as Organization;

  const [listings, badges] = await Promise.all([
    listPublicListingsByOrganization(params.orgId),
    listBadgesForOrganization(params.orgId)
  ]);

  const badgeTypes = Array.from(getActiveBadgeTypes(badges));
  const serializedListings = serializeFirestoreData(listings);

  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <AgenceVitrine
        organization={organization}
        listings={serializedListings}
        badgeTypes={badgeTypes}
      />
      <LegalFooter />
    </main>
  );
}
