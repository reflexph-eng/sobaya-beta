import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import { DEFAULT_ABOUT_CONTENT } from "@/types/about";
import type { AboutContent } from "@/types/about";

const ABOUT_DOC = doc(db, "platformConfig", "about");

export async function getAboutContent(): Promise<AboutContent> {
  try {
    const snap = await getDoc(ABOUT_DOC);
    if (!snap.exists()) return DEFAULT_ABOUT_CONTENT;
    return { ...DEFAULT_ABOUT_CONTENT, ...snap.data() } as AboutContent;
  } catch {
    return DEFAULT_ABOUT_CONTENT;
  }
}

export async function saveAboutContent(content: Partial<AboutContent>, userId?: string) {
  await setDoc(ABOUT_DOC, {
    ...content,
    _updatedAt: serverTimestamp(),
    _updatedBy: userId ?? null
  }, { merge: true });
}
