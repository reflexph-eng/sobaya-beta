"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { Property } from "@/types/property";

interface Props {
  properties: Property[];
}

const STATUS_COLORS: Record<string, string> = {
  occupied: "#DC2626",
  available: "#16A34A",
  maintenance: "#D97706",
  archived: "#6B7280"
};

export function PatrimoineMapInner({ properties }: Props) {
  const withCoords = properties.filter((p) => p.coordinates?.lat && p.coordinates?.lng);
  const center: LatLngExpression = withCoords.length > 0
    ? [withCoords[0].coordinates!.lat, withCoords[0].coordinates!.lng]
    : [5.3599517, -4.0082563];

  useEffect(() => {
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
    <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%", zIndex: 1 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((property) => (
        <Marker key={property.id} position={[property.coordinates!.lat, property.coordinates!.lng]}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{property.name}</p>
              <p className="text-gray-500">{property.commune ? `${property.commune}, ` : ""}{property.city}</p>
              <p className="mt-1">
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: STATUS_COLORS[property.status] ?? "#6B7280" }}
                >
                  {property.status === "occupied" ? "Occupé" :
                   property.status === "available" ? "Disponible" :
                   property.status === "maintenance" ? "En travaux" : property.status}
                </span>
              </p>
              <a
                href={`/biens?search=${encodeURIComponent(property.reference || property.name)}`}
                className="mt-2 block text-xs text-blue-600 underline"
              >
                Voir la fiche →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
