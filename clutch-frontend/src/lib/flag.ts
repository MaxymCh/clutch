/** Code pays ISO ("FR") → emoji drapeau ("🇫🇷"). Pur, sans dépendance. */
export const countryFlag = (countryCode: string): string =>
  countryCode
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
