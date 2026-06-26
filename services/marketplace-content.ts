import {
  addDoc, collection, deleteDoc, doc,
  getDocs, orderBy, query, serverTimestamp,
  updateDoc, where, getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export interface MarketplaceRubrique {
  id: string;
  titre: string;
  ordre: number;
  active: boolean;
  createdAt?: unknown;
}

export interface MarketplaceArticle {
  id: string;
  rubriqueId: string;
  titre: string;
  excerpt?: string;        // Résumé court affiché dans la liste
  content?: string;        // HTML TipTap — contenu complet
  coverImageUrl?: string;  // URL photo de couverture
  lien?: string;           // Lien externe optionnel
  slug: string;            // URL : /magazine/[slug]
  ordre: number;
  active: boolean;
  createdAt?: unknown;
}

const rubriquesCol = () => collection(db, "marketplaceRubriques");
const articlesCol = () => collection(db, "marketplaceArticles");

// ── Lecture publique ──────────────────────────────────────────────────────────

export async function getPublishedRubriques(): Promise<MarketplaceRubrique[]> {
  const q = query(rubriquesCol(), where("active", "==", true), orderBy("ordre", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MarketplaceRubrique);
}

export async function getPublishedArticlesByRubrique(rubriqueId: string): Promise<MarketplaceArticle[]> {
  const q = query(
    articlesCol(),
    where("rubriqueId", "==", rubriqueId),
    where("active", "==", true),
    orderBy("ordre", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MarketplaceArticle);
}

export async function getArticleBySlug(slug: string): Promise<MarketplaceArticle | null> {
  const q = query(articlesCol(), where("slug", "==", slug), where("active", "==", true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as MarketplaceArticle;
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAllRubriques(): Promise<MarketplaceRubrique[]> {
  const q = query(rubriquesCol(), orderBy("ordre", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MarketplaceRubrique);
}

export async function getAllArticles(): Promise<MarketplaceArticle[]> {
  const q = query(articlesCol(), orderBy("ordre", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as MarketplaceArticle);
}

export async function createRubrique(titre: string, ordre: number): Promise<string> {
  const ref = await addDoc(rubriquesCol(), {
    titre: titre.trim(), ordre, active: false, createdAt: serverTimestamp()
  });
  return ref.id;
}

export async function updateRubrique(id: string, data: Partial<Omit<MarketplaceRubrique, "id">>) {
  await updateDoc(doc(db, "marketplaceRubriques", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteRubrique(id: string) {
  await deleteDoc(doc(db, "marketplaceRubriques", id));
}

// Génère un slug propre depuis un titre
export function makeSlug(titre: string): string {
  return titre
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export async function createArticle(data: Omit<MarketplaceArticle, "id" | "createdAt">): Promise<string> {
  const ref = await addDoc(articlesCol(), { ...data, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateArticle(id: string, data: Partial<Omit<MarketplaceArticle, "id">>) {
  await updateDoc(doc(db, "marketplaceArticles", id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteArticle(id: string) {
  await deleteDoc(doc(db, "marketplaceArticles", id));
}
