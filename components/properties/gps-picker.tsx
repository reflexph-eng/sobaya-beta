"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Coordinates { lat: number; lng: number; }

const GpsPickerInner = dynamic(
  () => import("@/components/properties/gps-picker-inner").then((m) => m.GpsPickerInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center bg-sobaya-soft">
        <p className="text-sm text-sobaya-muted">Chargement de la carte...</p>
      </div>
    )
  }
);

export function GpsPicker({
  value,
  onChange
}: {
  value?: Coordinates | null;
  onChange: (coords: Coordinates | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [pendingCoords, setPendingCoords] = useState<Coordinates | null>(value ?? null);

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchError("");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=ci`,
        { headers: { "Accept-Language": "fr" } }
      );
      const results = await response.json();
      if (results.length === 0) {
        setSearchError("Adresse introuvable. Essayez d'être plus précis ou cliquez directement sur la carte.");
        return;
      }
      const { lat, lon } = results[0];
      setPendingCoords({ lat: Number(lat), lng: Number(lon) });
    } catch {
      setSearchError("Erreur de recherche. Cliquez directement sur la carte.");
    } finally {
      setSearching(false);
    }
  }

  function handleValidate() {
    if (pendingCoords) onChange(pendingCoords);
    setOpen(false);
  }

  function handleClear() {
    onChange(undefined);
    setPendingCoords(null);
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        {value?.lat && value?.lng ? (
          <>
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <MapPin size={14} />
              <span>Position enregistrée ({value.lat.toFixed(5)}, {value.lng.toFixed(5)})</span>
            </div>
            <Button type="button" variant="secondary" onClick={() => { setPendingCoords(value); setOpen(true); }}>
              Modifier la position
            </Button>
            <button type="button" onClick={handleClear} className="text-xs text-sobaya-muted hover:text-red-600">
              <X size={14} /> Retirer
            </button>
          </>
        ) : (
          <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
            <MapPin size={15} /> Localiser ce bien sur la carte
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-sobaya-border p-4">
      {/* Recherche d'adresse */}
      <div className="flex gap-2">
        <Input
          placeholder="Rechercher une adresse (ex: Cocody Riviera, Abidjan)"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); handleSearch(); } }}
          className="flex-1"
        />
        <Button type="button" disabled={searching} onClick={handleSearch}>
          {searching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
        </Button>
      </div>
      {searchError ? <p className="text-xs text-amber-600">{searchError}</p> : null}

      <p className="text-xs text-sobaya-muted">
        Cliquez sur la carte pour positionner le marqueur — ou faites-le glisser pour ajuster précisément.
      </p>

      {/* Carte */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div className="h-[320px] w-full overflow-hidden rounded-xl border border-sobaya-border">
        <GpsPickerInner
          initial={pendingCoords}
          onChange={setPendingCoords}
        />
      </div>

      {pendingCoords ? (
        <p className="text-xs text-sobaya-muted">
          Position sélectionnée : {pendingCoords.lat.toFixed(6)}, {pendingCoords.lng.toFixed(6)}
        </p>
      ) : (
        <p className="text-xs text-sobaya-muted">Aucune position sélectionnée — cliquez sur la carte.</p>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Annuler</Button>
        <Button type="button" disabled={!pendingCoords} onClick={handleValidate}>
          <MapPin size={15} /> Valider cette position
        </Button>
      </div>
    </div>
  );
}
