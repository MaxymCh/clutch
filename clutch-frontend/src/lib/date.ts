import type { Match } from '../types/esports';

/** Utilitaires purs de formatage de dates (locale fr). */

const parse = (iso: string): Date => new Date(`${iso}T00:00:00`);

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** Date locale "YYYY-MM-DD" — évite le décalage d'un jour via toISOString() (UTC). */
export const toIsoDateLocal = (d: Date): string => {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
};

/** Date de début locale d'un match à partir de la paire date+heure API. */
export const matchStartDateTime = (dateIso: string, time: string): Date =>
  new Date(`${dateIso}T${time}:00`);

/** Un prono est ouvert uniquement pour un match upcoming dont l'heure n'est pas dépassée. */
export const canPredictMatch = (match: Match, now: Date = new Date()): boolean => {
  if (match.status !== 'upcoming') return false;
  return matchStartDateTime(match.date, match.time).getTime() > now.getTime();
};

/** Match en cours : status upcoming ET heure de début dépassée (Liquipedia ne ping qu'à la fin). */
export const isMatchLive = (match: Match, now: Date = new Date()): boolean =>
  match.status === 'upcoming' &&
  matchStartDateTime(match.date, match.time).getTime() <= now.getTime();

/** "2026-07-11" → "Sam" */
export const formatWeekdayShort = (iso: string): string =>
  cap(parse(iso).toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', ''));

/** "2026-07-11" → "juil." */
export const formatMonthShort = (iso: string): string =>
  parse(iso).toLocaleDateString('fr-FR', { month: 'short' });

/** "2026-07-11" → "11 juil" */
export const formatDayMonth = (iso: string): string =>
  parse(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }).replace('.', '');

/** Section LP type "June 17" — redondante avec la date affichée à côté. */
export const isDateLikePhase = (phase: string): boolean =>
  /^(?:january|february|march|april|may|june|july|august|september|october|november|december|janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)\s+\d{1,2}(?:st|nd|rd|th)?$/i.test(
    phase.trim(),
  );

/** Phase affichable en méta : "June 17" → "17 juin", sinon libellé de phase. */
export const phaseMetaLabel = (phase: string, dateIso?: string): string | null => {
  if (isDateLikePhase(phase)) {
    return dateIso ? formatDayMonth(dateIso) : null;
  }
  if (phase?.trim()) return phase.trim();
  return null;
};

/** Sous-titre match : phase (si utile) + jour FR + heure optionnelle. */
export const formatMatchPhaseDate = (
  phase: string,
  dateIso: string,
  opts?: { time?: string; showTime?: boolean },
): string => {
  const parts: string[] = [];
  if (phase && !isDateLikePhase(phase)) parts.push(phase);
  parts.push(`${formatWeekdayShort(dateIso)} ${formatDayMonth(dateIso)}`);
  if (opts?.showTime && opts.time) parts.push(opts.time);
  return parts.join(' · ');
};

/** "2026-07-11" → "11/07" */
export const formatDDMM = (iso: string): string => {
  const d = parse(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

/** "2026-07-11" → "Samedi 11 juillet" */
export const formatDayFull = (iso: string): string =>
  cap(parse(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));

/** Libellé relatif par rapport à un jour de référence ("Hier", "Aujourd'hui"…) */
export const formatRelativeDay = (iso: string, todayIso: string): string => {
  const diff = Math.round((parse(iso).getTime() - parse(todayIso).getTime()) / 86_400_000);
  if (diff === -1) return 'Hier';
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Demain';
  return `${formatWeekdayShort(iso)} ${formatDayMonth(iso)}`;
};
