/**
 * Contenu de la page /a-propos, géré depuis /admin/about.
 * Stocké dans Firestore : platformConfig/about
 */
export interface AboutContent {
  // Hero
  heroImage: string;
  heroTagline: string;

  // Fondateur
  fondateurPhoto: string;
  fondateurNom: string;
  fondateurTitre: string;
  fondateurBio: string;

  // Mission
  missionImage: string;

  // Témoignages
  testimonials: AboutTestimonial[];

  // Chiffres (optionnel — si vide, on affiche des placeholders)
  statBiens?: string;
  statOrganisations?: string;
  statAnnonces?: string;

  _updatedAt?: unknown;
  _updatedBy?: string | null;
}

export interface AboutTestimonial {
  id: string;
  nom: string;
  titre: string;
  photo: string;
  texte: string;
  actif: boolean;
}

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  heroImage: "/about/hero.svg",
  heroTagline: "Construite ici, pour vous.",
  fondateurPhoto: "/about/fondateur.svg",
  fondateurNom: "Lanfia Touré",
  fondateurTitre: "Directeur Général — Cabinet Grain de Sel",
  fondateurBio: "Propriétaire de biens immobiliers à Abidjan, j'ai longtemps cherché un outil adapté à notre réalité ivoirienne — le Mobile Money, la gestion informelle, les propriétaires qui travaillent seuls. Je n'en ai pas trouvé. Alors je l'ai construit.",
  missionImage: "/about/abidjan.svg",
  testimonials: [
    { id: "t1", nom: "Prénom Nom", titre: "Propriétaire, Cocody", photo: "/about/testimonial-1.svg", texte: "Votre témoignage ici.", actif: false },
    { id: "t2", nom: "Prénom Nom", titre: "Agent immobilier, Yopougon", photo: "/about/testimonial-2.svg", texte: "Votre témoignage ici.", actif: false },
    { id: "t3", nom: "Prénom Nom", titre: "Agence, Plateau", photo: "/about/testimonial-3.svg", texte: "Votre témoignage ici.", actif: false },
  ],
  statBiens: "",
  statOrganisations: "",
  statAnnonces: "",
};
