import { Clock } from "lucide-react";
import { InvitationForm } from "./invitation-form";
import { getInvitationByToken, isInvitationValid } from "@/services/tenant-invitations";
import { serializeFirestoreData } from "@/lib/serialize-firestore";

export const dynamic = "force-dynamic";

export default async function InvitationPage({
  params
}: {
  params: { orgId: string; token: string }
}) {
  const { orgId, token } = params;

  // Lecture Firestore côté serveur — params garantis disponibles
  const raw = await getInvitationByToken(orgId, token).catch(() => null);
  const invitation = raw ? serializeFirestoreData(raw) : null;
  const valid = invitation ? isInvitationValid(invitation) : false;

  // Lien invalide, expiré ou introuvable
  if (!invitation || !valid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-sobaya-soft px-5 text-center">
        <div className="rounded-2xl border border-sobaya-border bg-white p-8 max-w-sm w-full shadow-soft">
          <Clock size={40} className="mx-auto text-sobaya-muted mb-4" />
          <h1 className="text-lg font-bold text-sobaya-ink">Lien expiré ou invalide</h1>
          <p className="mt-2 text-sm text-sobaya-muted">
            Ce lien d&apos;invitation n&apos;est plus valide. Il a peut-être expiré
            (validité 7 jours) ou a déjà été utilisé. Contactez votre propriétaire
            pour en obtenir un nouveau.
          </p>
        </div>
        <p className="mt-6 text-xs text-sobaya-muted">sobaya.ci</p>
      </div>
    );
  }

  // Formulaire interactif — données passées depuis le serveur
  return <InvitationForm invitation={invitation} orgId={orgId} />;
}
