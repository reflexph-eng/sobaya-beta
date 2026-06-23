/**
 * Next.js App Router interdit de passer des instances de classe (donc les
 * Timestamp Firestore) en props d'un Server Component vers un Client
 * Component — seuls des objets/tableaux/valeurs primitives "plain" sont
 * acceptés. Les données lues depuis Firestore dans une Server Component
 * (ex. app/(public)/marketplace/page.tsx) doivent donc être passées dans
 * cette fonction avant d'être transmises à un composant "use client".
 *
 * Convertit récursivement tout Timestamp Firestore (objet avec une méthode
 * toDate()) en chaîne ISO 8601, et laisse le reste inchangé.
 */
export function serializeFirestoreData<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (typeof value === "object" && "toDate" in (value as object) && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as unknown as { toDate: () => Date }).toDate().toISOString() as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeFirestoreData(item)) as unknown as T;
  }

  if (typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = serializeFirestoreData(val);
    }
    return result as T;
  }

  return value;
}
