/**
 * Annonces de démonstration — affichées quand il n'y a pas encore assez
 * de vraies annonces. Remplacées automatiquement au fur et à mesure.
 */

export interface DemoListing {
  id: string;
  title: string;
  city: string;
  commune?: string;
  monthlyRent: number;
  rooms: number;
  surfaceArea: number;
  isFurnished: boolean;
  type: string;
  isDemo: true;
  svgColor: string; // couleur de fond du placeholder SVG
}

export const DEMO_LISTINGS: DemoListing[] = [
  // Abidjan
  { id: "demo-1", title: "Appartement moderne à Cocody", city: "Abidjan", commune: "Cocody", monthlyRent: 180000, rooms: 3, surfaceArea: 85, isFurnished: true, type: "apartment", isDemo: true, svgColor: "#0F766E" },
  { id: "demo-2", title: "Studio meublé Plateau", city: "Abidjan", commune: "Plateau", monthlyRent: 95000, rooms: 1, surfaceArea: 35, isFurnished: true, type: "studio", isDemo: true, svgColor: "#115E59" },
  { id: "demo-3", title: "Villa 4 pièces Riviera Golf", city: "Abidjan", commune: "Riviera", monthlyRent: 450000, rooms: 4, surfaceArea: 200, isFurnished: false, type: "house", isDemo: true, svgColor: "#134E4A" },
  { id: "demo-4", title: "Appartement 2 pièces Marcory", city: "Abidjan", commune: "Marcory", monthlyRent: 120000, rooms: 2, surfaceArea: 55, isFurnished: false, type: "apartment", isDemo: true, svgColor: "#0F766E" },
  { id: "demo-5", title: "Bureau professionnel Zone 4", city: "Abidjan", commune: "Zone 4", monthlyRent: 280000, rooms: 3, surfaceArea: 110, isFurnished: true, type: "office", isDemo: true, svgColor: "#1D4ED8" },
  { id: "demo-6", title: "Studio Yopougon centre", city: "Abidjan", commune: "Yopougon", monthlyRent: 65000, rooms: 1, surfaceArea: 28, isFurnished: false, type: "studio", isDemo: true, svgColor: "#7C3AED" },
  // Intérieur du pays
  { id: "demo-7", title: "Maison familiale à Bouaké", city: "Bouaké", monthlyRent: 85000, rooms: 4, surfaceArea: 120, isFurnished: false, type: "house", isDemo: true, svgColor: "#B45309" },
  { id: "demo-8", title: "Appartement centre Yamoussoukro", city: "Yamoussoukro", monthlyRent: 70000, rooms: 2, surfaceArea: 60, isFurnished: true, type: "apartment", isDemo: true, svgColor: "#0369A1" },
  { id: "demo-9", title: "Villa résidentielle San Pedro", city: "San Pedro", monthlyRent: 150000, rooms: 3, surfaceArea: 95, isFurnished: false, type: "house", isDemo: true, svgColor: "#065F46" },
  { id: "demo-10", title: "Local commercial Daloa", city: "Daloa", monthlyRent: 110000, rooms: 2, surfaceArea: 75, isFurnished: false, type: "store", isDemo: true, svgColor: "#9D174D" },
  { id: "demo-11", title: "Appartement Korhogo nord", city: "Korhogo", monthlyRent: 55000, rooms: 2, surfaceArea: 50, isFurnished: false, type: "apartment", isDemo: true, svgColor: "#92400E" },
  { id: "demo-12", title: "Maison avec jardin Abengourou", city: "Abengourou", monthlyRent: 75000, rooms: 3, surfaceArea: 100, isFurnished: false, type: "house", isDemo: true, svgColor: "#1E3A5F" },
];

export const ABIDJAN_DEMOS = DEMO_LISTINGS.filter(d => d.city === "Abidjan");
export const INTERIOR_DEMOS = DEMO_LISTINGS.filter(d => d.city !== "Abidjan");
