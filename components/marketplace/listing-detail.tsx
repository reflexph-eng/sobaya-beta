"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CheckCircle2, Home, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { submitContactRequest } from "@/services/listings";
import { PROPERTY_AMENITIES } from "@/types/property";
import { SELLER_TYPE_LABELS } from "@/types/listing";
import { BookingRequestForm } from "@/components/marketplace/booking-request-form";
import { ListingMap } from "@/components/marketplace/listing-map";
import { isCurrentlyFeatured } from "@/services/listings";
import { ListingBadges } from "@/components/marketplace/listing-badges";
import type { PublicListing } from "@/types/listing";

function money(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF", maximumFractionDigits: 0 }).format(value || 0);
}

export function ListingDetail({ listing }: { listing: PublicListing }) {
  const router = useRouter();
  const [activePhoto, setActivePhoto] = useState(0);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(`Bonjour, je suis intéressé(e) par ce bien : ${listing.title}.`);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const photos = listing.photoGallery ?? [];
  const amenityLabels = (listing.amenities ?? []).map((value) => PROPERTY_AMENITIES.find((a) => a.value === value)?.label ?? value);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError("Indiquez votre nom et votre téléphone.");
      return;
    }
    setSending(true);
    setError("");
    try {
      await submitContactRequest({
        listingId: listing.id,
        organizationId: listing.organizationId,
        propertyId: listing.propertyId,
        visitorName: name.trim(),
        visitorPhone: phone.trim(),
        visitorEmail: email.trim() || undefined,
        message: message.trim()
      });
      setSent(true);
    } catch {
      setError("Échec de l'envoi. Réessayez ou contactez directement par téléphone.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-16">
      <button type="button" onClick={() => router.push("/marketplace")} className="mb-4 text-sm text-sobaya-muted hover:text-sobaya-ink hover:underline">
        ← Retour aux annonces
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-sobaya-soft">
            {photos[activePhoto] ? (
              <Image src={photos[activePhoto].url} alt={listing.title} className="h-full w-full object-cover" fill unoptimized />
            ) : (
              <div className="flex h-full items-center justify-center text-sobaya-muted"><Home size={40} /></div>
            )}
          </div>
          {photos.length > 1 ? (
            <div className="mt-3 grid grid-cols-6 gap-2">
              {photos.map((photo, index) => (
                <button key={photo.id} type="button" onClick={() => setActivePhoto(index)} className={`aspect-square overflow-hidden rounded-lg border-2 ${index === activePhoto ? "border-sobaya-primary" : "border-transparent"}`}>
                  <Image src={photo.url} alt="" className="h-full w-full object-cover" fill unoptimized />
                </button>
              ))}
            </div>
          ) : null}

          <h1 className="mt-6 text-2xl font-semibold text-sobaya-ink">{listing.title}</h1>
          {isCurrentlyFeatured(listing) ? (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-semibold text-amber-700">
              ⭐ Annonce en vedette
            </span>
          ) : null}
          <p className="mt-1 text-sobaya-muted">{listing.commune ? `${listing.commune}, ` : ""}{listing.city}</p>
          <p className="mt-3 text-2xl font-semibold text-sobaya-primary">{money(listing.monthlyRent)}<span className="text-sm font-normal text-sobaya-muted"> /mois{listing.charges ? ` + ${money(listing.charges)} de charges` : ""}</span></p>

          <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-xl border border-sobaya-border p-3 text-center"><p className="font-medium text-sobaya-ink">{listing.rooms}</p><p className="text-xs text-sobaya-muted">Pièces</p></div>
            <div className="rounded-xl border border-sobaya-border p-3 text-center"><p className="font-medium text-sobaya-ink">{listing.surfaceArea || "—"}</p><p className="text-xs text-sobaya-muted">m²</p></div>
            <div className="rounded-xl border border-sobaya-border p-3 text-center"><p className="font-medium text-sobaya-ink">{listing.isFurnished ? "Oui" : "Non"}</p><p className="text-xs text-sobaya-muted">Meublé</p></div>
          </div>

          <p className="mt-6 whitespace-pre-line leading-7 text-sobaya-ink">{listing.description}</p>

          {amenityLabels.length > 0 ? (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-sobaya-ink">Équipements</p>
              <div className="flex flex-wrap gap-2">
                {amenityLabels.map((label) => <span key={label} className="rounded-full bg-sobaya-soft px-3 py-1 text-xs text-sobaya-muted">{label}</span>)}
              </div>
            </div>
          ) : null}

          {listing.coordinates?.lat && listing.coordinates?.lng ? (
            <ListingMap
              lat={listing.coordinates.lat}
              lng={listing.coordinates.lng}
              title={listing.title}
              address={listing.commune ? `${listing.commune}, ${listing.city}` : listing.city}
              approximate
            />
          ) : null}
        </div>

        <div>
          <div className="sticky top-6 rounded-2xl border border-sobaya-border p-5">
            <p className="font-medium text-sobaya-ink">{listing.organizationName}</p>
            <ListingBadges organizationId={listing.organizationId} />
            {listing.sellerType ? (
              <span className="mt-1 inline-block rounded-full bg-sobaya-soft px-2.5 py-1 text-xs font-medium text-sobaya-muted">
                {SELLER_TYPE_LABELS[listing.sellerType] ?? "Annonceur"}
              </span>
            ) : null}
            <div className="mt-3 flex flex-col gap-2">
              <a href={`tel:${listing.contactPhone}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sobaya-primary px-5 py-2 text-sm font-medium text-white transition hover:bg-sobaya-primaryDark">
                <Phone size={16} /> {listing.contactPhone}
              </a>
              {listing.contactWhatsapp ? (
                <a href={`https://wa.me/${listing.contactWhatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sobaya-border bg-white px-5 py-2 text-sm font-medium text-sobaya-ink transition hover:bg-sobaya-soft">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              ) : null}
            </div>

            <div className="mt-5 border-t border-sobaya-border pt-5">
              {listing.exploitationMode === "furnished_short_term" ? (
                <BookingRequestForm listing={listing} />
              ) : sent ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
                  <CheckCircle2 size={18} /> Votre demande a été envoyée. L&apos;annonceur vous recontactera directement.
                </div>
              ) : (
                <form className="space-y-3" onSubmit={handleSubmit}>
                  <p className="text-sm font-medium text-sobaya-ink">Ou laissez vos coordonnées</p>
                  <FormField label="Nom" required>
                    <Input value={name} onChange={(event) => setName(event.target.value)} required />
                  </FormField>
                  <FormField label="Téléphone" required>
                    <Input value={phone} onChange={(event) => setPhone(event.target.value)} required />
                  </FormField>
                  <FormField label="Email" help="Optionnel.">
                    <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
                  </FormField>
                  <FormField label="Message">
                    <textarea className="min-h-20 w-full rounded-xl border border-sobaya-border bg-white px-4 py-3 text-sm outline-none focus:border-sobaya-primary" value={message} onChange={(event) => setMessage(event.target.value)} />
                  </FormField>
                  {error ? <p className="text-xs text-red-600">{error}</p> : null}
                  <Button type="submit" className="w-full" disabled={sending}>{sending ? "Envoi..." : "Envoyer la demande"}</Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
