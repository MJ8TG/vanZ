export type SeoPageSlug = 
  | "transport-meuble-tunis"
  | "transport-meuble-sfax"
  | "transport-meuble-sousse"
  | "transport-canape-tunis"
  | "transport-frigo-tunis"
  | "transport-machine-laver"
  | "livraison-tunis-sfax"
  | "livraison-tunis-sousse"
  | "demenagement-tunis"
  | "demenagement-pas-cher"
  | "transport-meuble-ariana"
  | "transport-meuble-monastir"
  | "prix-transport-meuble-tunis";

export interface SeoPageConfig {
  slug: SeoPageSlug;
  translationKey: string;
  city: string;
}

export const seoPagesConfig: SeoPageConfig[] = [
  { slug: "transport-meuble-tunis", translationKey: "meubleTunis", city: "Tunis" },
  { slug: "transport-meuble-sfax", translationKey: "meubleSfax", city: "Sfax" },
  { slug: "transport-meuble-sousse", translationKey: "meubleSousse", city: "Sousse" },
  { slug: "transport-canape-tunis", translationKey: "canapeTunis", city: "Tunis" },
  { slug: "transport-frigo-tunis", translationKey: "frigoTunis", city: "Tunis" },
  { slug: "transport-machine-laver", translationKey: "machineLaver", city: "Tunis" },
  { slug: "livraison-tunis-sfax", translationKey: "livraisonTunisSfax", city: "Tunis-Sfax" },
  { slug: "livraison-tunis-sousse", translationKey: "livraisonTunisSousse", city: "Tunis-Sousse" },
  { slug: "demenagement-tunis", translationKey: "demenagementTunis", city: "Tunis" },
  { slug: "demenagement-pas-cher", translationKey: "demenagementPasCher", city: "Tunisie" },
  { slug: "transport-meuble-ariana", translationKey: "meubleAriana", city: "Ariana" },
  { slug: "transport-meuble-monastir", translationKey: "meubleMonastir", city: "Monastir" },
  { slug: "prix-transport-meuble-tunis", translationKey: "prixMeubleTunis", city: "Tunis" }
];

export const getSeoPageConfig = (slug: string) => {
  return seoPagesConfig.find((config) => config.slug === slug);
};
