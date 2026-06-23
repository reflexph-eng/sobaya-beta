"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

/**
 * Composant interne utilisé par ListingMap via dynamic import (ssr: false).
 * Ne jamais importer directement — toujours passer par ListingMap qui gère
 * le chargement côté client uniquement (Leaflet utilise window/document).
 */
export function LeafletMapInner({
  lat,
  lng,
  title,
  approximate
}: {
  lat: number;
  lng: number;
  title: string;
  /** Si true, affiche un cercle de ~300m au lieu d'un marqueur exact (localisation approximative). */
  approximate?: boolean;
}) {
  const position: LatLngExpression = [lat, lng];

  useEffect(() => {
    // Correction du bug d'icônes Leaflet dans Next.js via import dynamique.
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
      });
    });
  }, []);

  return (
    <MapContainer
      center={position}
      zoom={approximate ? 14 : 16}
      scrollWheelZoom={false}
      className="h-full w-full rounded-2xl"
      style={{ zIndex: 1 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {approximate ? (
        <Circle
          center={position}
          radius={300}
          pathOptions={{ color: "#0F766E", fillColor: "#0F766E", fillOpacity: 0.15, weight: 2 }}
        />
      ) : (
        <Marker position={position}>
          <Popup>{title}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
