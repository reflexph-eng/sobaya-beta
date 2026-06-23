"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { PublicListing } from "@/types/listing";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function MapWithMarkers({
  listings,
  center,
  onMarkerClick
}: {
  listings: PublicListing[];
  center: { lat: number; lng: number };
  onMarkerClick: (listing: PublicListing) => void;
}) {
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

  const mapCenter: LatLngExpression = [center.lat, center.lng];

  return (
    <MapContainer center={mapCenter} zoom={12} scrollWheelZoom style={{ height: "100%", width: "100%", zIndex: 1 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {listings.map((listing) => {
        if (!listing.coordinates?.lat || !listing.coordinates?.lng) return null;
        const position: LatLngExpression = [listing.coordinates.lat, listing.coordinates.lng];
        return (
          <Marker key={listing.id} position={position} eventHandlers={{ click: () => onMarkerClick(listing) }}>
            <Popup>
              <strong>{listing.title}</strong><br />
              {money(listing.monthlyRent)} /mois
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
