"use client";

import { Settings } from "lucide-react";
import { SuperAdminGate } from "@/components/admin-saas/super-admin-gate";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

const modules = ["Biens", "Locataires", "Contrats", "Paiements", "Quittances", "Maintenance", "Prestataires", "Reporting", "Dashboard", "Notifications"];
const futureModules = ["Documents", "Signature électronique", "Abonnements", "Marketplace", "Mobile", "IA SOBAYA"];

export function SaasSettingsManager() {
  return <SuperAdminGate><div className="space-y-5"><PageHeader title="Paramètres SaaS" description="Préparation du contrôle des modules SOBAYA." />
    <Card><div className="flex gap-3"><Settings className="mt-1 text-sobaya-muted" size={22}/><div><p className="font-medium">Modules actifs pour la bêta</p><p className="mt-1 text-sm text-sobaya-muted">Cette page prépare le pilotage plateforme. Les bascules techniques seront durcies pendant la professionnalisation.</p></div></div></Card>
    <div className="grid gap-4 md:grid-cols-2"><Card><p className="font-medium">Modules disponibles</p><div className="mt-4 flex flex-wrap gap-2">{modules.map((item) => <StatusBadge key={item} tone="success">{item}</StatusBadge>)}</div></Card><Card><p className="font-medium">Modules après test terrain</p><div className="mt-4 flex flex-wrap gap-2">{futureModules.map((item) => <StatusBadge key={item} tone="neutral">{item}</StatusBadge>)}</div></Card></div>
    <Card><p className="font-medium">Identité plateforme</p><div className="mt-3 grid gap-3 text-sm text-sobaya-muted md:grid-cols-3"><p>Nom : SOBAYA</p><p>Slogan : Votre patrimoine. Sous contrôle.</p><p>Phase : BETA 1.0</p></div></Card>
  </div></SuperAdminGate>;
}
