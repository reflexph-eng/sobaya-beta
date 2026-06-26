import {
  doc, getDoc, serverTimestamp, setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export type EditableLegalType = "cgu" | "confidentialite" | "mentions-legales" | "cgs" | "verification";

export interface LegalPageContent {
  type: EditableLegalType;
  title: string;
  content: string; // HTML depuis TipTap
  updatedAt?: unknown;
  updatedBy?: string;
}

const TITLES: Record<EditableLegalType, string> = {
  "cgu": "Conditions Générales d'Utilisation",
  "confidentialite": "Politique de Confidentialité",
  "mentions-legales": "Mentions Légales",
  "cgs": "Conditions Générales de Service",
  "verification": "Politique de Vérification"
};

export function getLegalTitle(type: EditableLegalType): string {
  return TITLES[type];
}

function legalDoc(type: EditableLegalType) {
  return doc(db, "legalPages", type);
}

export async function getLegalPage(type: EditableLegalType): Promise<LegalPageContent | null> {
  const snap = await getDoc(legalDoc(type));
  if (!snap.exists()) return null;
  return snap.data() as LegalPageContent;
}

export async function saveLegalPage(
  type: EditableLegalType,
  content: string,
  updatedBy?: string
): Promise<void> {
  await setDoc(legalDoc(type), {
    type,
    title: TITLES[type],
    content,
    updatedAt: serverTimestamp(),
    updatedBy: updatedBy ?? null
  });
}
