import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface PlatformSettings {
  // Coordonnées publiques
  contactWhatsapp?: string;
  contactEmail?: string;
  contactAddress?: string;
  contactCompanyName?: string;
  // Textes marketing
  headerSlogan?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  ctaTitle?: string;
  ctaSubtitle?: string;
  // Template relance locataire
  arrearsMessageTemplate?: string;
  // Meta
  updatedAt?: unknown;
  updatedBy?: string;
}

// Valeurs par défaut — utilisées si Firestore est vide
export const PLATFORM_DEFAULTS: Required<Omit<PlatformSettings, "updatedAt" | "updatedBy">> = {
  contactWhatsapp: "2250700000000",
  contactEmail: "contact@sobaya.ci",
  contactAddress: "Port-Bouët, Abidjan, Côte d'Ivoire",
  contactCompanyName: "Cabinet Grain de Sel",
  headerSlogan: "Votre patrimoine. Sous contrôle.",
  heroTitle: "Trouvez votre prochain logement idéal.",
  heroSubtitle: "Des milliers d'annonces publiées par des propriétaires et agences de confiance partout en Côte d'Ivoire.",
  ctaTitle: "Vous avez un bien à louer ?",
  ctaSubtitle: "Publiez gratuitement et touchez des milliers de visiteurs qualifiés en Côte d'Ivoire.",
  arrearsMessageTemplate: "Bonjour {nom}, sauf erreur, votre loyer présente un retard de {mois_count} mois ({mois_liste}) pour un montant total de {montant}. Merci de régulariser votre situation. SOBAYA"
};

const settingsDoc = () => doc(db, "platformSettings", "main");

export async function getPlatformSettings(): Promise<PlatformSettings> {
  try {
    const snap = await getDoc(settingsDoc());
    if (!snap.exists()) return PLATFORM_DEFAULTS;
    return { ...PLATFORM_DEFAULTS, ...snap.data() } as PlatformSettings;
  } catch {
    return PLATFORM_DEFAULTS;
  }
}

export async function savePlatformSettings(
  data: Partial<PlatformSettings>,
  updatedBy?: string
): Promise<void> {
  await setDoc(settingsDoc(), {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: updatedBy ?? null
  }, { merge: true });
}

// Hook React pour lire les settings côté client
export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(PLATFORM_DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getPlatformSettings()
      .then(s => { setSettings(s); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  return { settings, loaded };
}

// Import nécessaire pour le hook
import { useState, useEffect } from "react";
