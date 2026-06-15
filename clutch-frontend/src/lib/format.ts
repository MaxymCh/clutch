/** Formatage de nombres (locale fr). */

/** 8421 → "8 421" (espace insécable fr) */
export const formatPoints = (n: number): string => n.toLocaleString('fr-FR');
