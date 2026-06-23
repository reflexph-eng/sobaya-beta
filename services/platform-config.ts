import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { SOBAYA_MODULES } from "@/types/platform-config";
import type { ModulesState, SobayanModule } from "@/types/platform-config";

const PLATFORM_CONFIG_DOC = doc(db, "platformConfig", "modules");

/**
 * Récupère l'état actuel des modules depuis Firestore.
 * Si aucune configuration n'existe, retourne l'état par défaut
 * (tous les modules activés selon leur `defaultEnabled`).
 */
export async function getModulesState(): Promise<ModulesState> {
  try {
    const snapshot = await getDoc(PLATFORM_CONFIG_DOC);
    if (!snapshot.exists()) return buildDefaultState();
    return snapshot.data() as ModulesState;
  } catch {
    // En cas d'erreur de lecture (ex. règles non encore déployées),
    // on retourne l'état par défaut plutôt que de bloquer tout le dashboard.
    return buildDefaultState();
  }
}

export async function saveModulesState(state: ModulesState, userId?: string) {
  await setDoc(PLATFORM_CONFIG_DOC, {
    ...state,
    _updatedAt: serverTimestamp(),
    _updatedBy: userId ?? null
  });
}

export function buildDefaultState(): ModulesState {
  const state: ModulesState = {};
  for (const module of SOBAYA_MODULES) {
    state[module.id] = module.defaultEnabled;
  }
  return state;
}

/** Retourne true si un module est actif selon la configuration courante. */
export function isModuleEnabled(state: ModulesState, moduleId: SobayanModule): boolean {
  const module = SOBAYA_MODULES.find((m) => m.id === moduleId);
  if (!module) return false;
  if (module.isCoreModule) return true; // Les modules socle ne peuvent jamais être désactivés
  return state[moduleId] ?? module.defaultEnabled;
}
