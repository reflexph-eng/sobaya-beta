import { collection, doc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { AdSpot, AdSpotSlot } from "@/types/ad-spot";

function adSpotsCollection() {
  return collection(db, "adSpots");
}

const AD_SLOT_DEFAULT_ALT: Record<AdSpotSlot, string> = {
  banner_top: "Bannière publicitaire",
  sidebar_left_1: "Publicité",
  sidebar_left_2: "Publicité",
  sidebar_right: "Publicité"
};

export async function listAdSpots(): Promise<AdSpot[]> {
  const snapshot = await getDocs(adSpotsCollection());
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AdSpot);
}

export async function getAdSpotsMap(): Promise<Partial<Record<AdSpotSlot, AdSpot>>> {
  const spots = await listAdSpots();
  const map: Partial<Record<AdSpotSlot, AdSpot>> = {};
  for (const spot of spots) {
    map[spot.slot] = spot;
  }
  return map;
}

export async function saveAdSpot(
  slot: AdSpotSlot,
  values: Pick<AdSpot, "imageUrl" | "targetUrl" | "altText" | "isActive">,
  userId?: string
) {
  await setDoc(doc(db, "adSpots", slot), {
    slot,
    imageUrl: values.imageUrl.trim(),
    targetUrl: values.targetUrl.trim(),
    altText: values.altText.trim() || AD_SLOT_DEFAULT_ALT[slot],
    isActive: values.isActive,
    updatedBy: userId ?? null,
    updatedAt: serverTimestamp()
  });
}
