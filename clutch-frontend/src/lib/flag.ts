const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['fr'], { type: 'region' })
    : null;

/** Code pays ISO ("FR") → nom du pays ("France"). Vide si inconnu ("XX"). */
export const countryName = (countryCode: string): string => {
  const code = countryCode.toUpperCase();
  if (!code || code === 'XX') return '';
  try {
    return regionNames?.of(code) ?? '';
  } catch {
    return '';
  }
};
