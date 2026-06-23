"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import type { LatLng, Map as LeafletMap } from "leaflet";

interface Coordinates { lat: number; lng: number; }

/** Composant interne qui écoute les clics sur la carte pour déplacer le marqueur. */
function ClickHandler({ onMove }: { onMove: (coords: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onMove({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });
  return null;
}

export function GpsPickerInner({
  initial,
  onChange
}: {
  initial?: Coordinates | null;
  onChange: (coords: Coordinates) => void;
}) {
  const defaultCenter: [number, number] = initial
    ? [initial.lat, initial.lng]
    : [5.3599517, -4.0082563]; // Abidjan par défaut

  const [position, setPosition] = useState<Coordinates | null>(initial ?? null);
  const mapRef = useRef<LeafletMap | null>(null);

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

  function handleMove(coords: Coordinates) {
    setPosition(coords);
    onChange(coords);
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", zIndex: 1 }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMove={handleMove} />
      {position ? (
        <Marker
          position={[position.lat, position.lng]}
          draggable
          eventHandlers={{
            dragend(event) {
              const latlng: LatLng = event.target.getLatLng();
              handleMove({ lat: latlng.lat, lng: latlng.lng });
            }
          }}
        />
      ) : null}
    </MapContainer>
  );
}
