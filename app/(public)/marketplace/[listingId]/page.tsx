import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/layout/public-header";
import { LegalFooter } from "@/components/layout/legal-footer";
import { ListingDetail } from "@/components/marketplace/listing-detail";
import { getPublicListing } from "@/services/listings";
import { serializeFirestoreData } from "@/lib/serialize-firestore";

export const dynamic = "force-dynamic";

export default async function ListingPage({ params }: { params: { listingId: string } }) {
  const rawListing = await getPublicListing(params.listingId);
  if (!rawListing || !rawListing.isActive) notFound();
  const listing = serializeFirestoreData(rawListing);

  return (
    <main className="min-h-screen bg-white">
      <PublicHeader />
      <ListingDetail listing={listing} />
      <LegalFooter />
    </main>
  );
}
