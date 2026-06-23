"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { List, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { useAuth } from "@/components/providers/auth-provider";
import { listProperties } from "@/services/properties";
import type { Property } from "@/types/property";

const PatrimoineMapInner = dynamic(
  () => import("@/components/properties/patrimoine-map-inner").then((m) => m.PatrimoineMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-sobaya-soft rounded-2xl">
        <p className="text-sm text-sobaya-muted">Chargement de la carte...</p>
      </div>
    )
  }
);

export function PatrimoineMap() {
  const { organization } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!organization?.id) return;
    setLoading(true);
    try {
      const data = await listProperties(organization.id);
      setProperties(data.filter((p) => p.isDeleted !== true && p.status !== "archived"));
    } finally {
      setLoading(false);
    }
  }, [organization?.id]);

  useEffect(() => { refresh(); }, [refresh]);

  const withCoords = properties.filter((p) => p.coordinates?.lat && p.coordinates?.lng);
  const withoutCoords = properties.length - withCoords.length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Carte du patrimoine"
        description="Vue cartographique de vos biens géolocalisés."
      />

      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-sobaya-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 inline-block" /> Occupé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block" /> En travaux
          </span>
        </div>
        <Link href="/biens" className="flex items-center gap-2 text-sm font-medium text-sobaya-primary hover:underline">
          <List size={15} /> Vue liste
        </Link>
      </div>

      {loading ? (
        <Card className="flex h-[500px] items-center justify-center">
          <p className="text-sm text-sobaya-muted">Chargement des biens...</p>
        </Card>
      ) : withCoords.length === 0 ? (
        <Card className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
          <MapPin size={32} className="text-sobaya-muted" />
          <p className="font-medium text-sobaya-ink">Aucun bien géolocalisé</p>
          <p className="max-w-sm text-sm text-sobaya-muted">
            Ajoutez une position GPS à vos biens depuis leur fiche (bouton &quot;Localiser ce bien sur la carte&quot;)
            pour les voir apparaître ici.
          </p>
          <Link href="/biens" className="text-sm font-medium text-sobaya-primary underline underline-offset-2">
            Aller sur la liste des biens →
          </Link>
        </Card>
      ) : (
        <>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <div className="h-[520px] w-full overflow-hidden rounded-2xl border border-sobaya-border">
            <PatrimoineMapInner properties={properties} />
          </div>
          {withoutCoords > 0 ? (
            <p className="text-xs text-sobaya-muted">
              {withCoords.length} bien(s) affiché(s) sur la carte · {withoutCoords} bien(s) sans coordonnées GPS
              — <Link href="/biens" className="underline">les géolocaliser</Link>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
