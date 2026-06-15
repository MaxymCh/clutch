import type { MapScore } from '../../types/esports';

/** Détail carte par carte d'un match (live ou terminé). */
export const MapList = ({ maps }: { maps: MapScore[] }) => (
  <div className="px-5 pt-5">
    <h2 className="mb-1 text-xs font-bold tracking-[.08em] text-dim uppercase">Cartes</h2>
    {maps.map((map, i) => (
      <div
        key={map.name}
        className={`grid grid-cols-[20px_1fr_auto] items-center gap-3 border-b border-line py-3 ${
          map.live ? 'bg-gradient-to-r from-accent/5 to-transparent' : ''
        }`}
      >
        <span className="text-[13px] font-semibold text-faint">{i + 1}</span>
        <span className="flex items-center gap-2 text-[15px] font-semibold text-ink">
          {map.name}
          {map.live && (
            <span className="animate-live-blink text-[9px] font-extrabold tracking-[.08em] text-accent">
              EN COURS
            </span>
          )}
        </span>
        <span className="text-base font-semibold tabular-nums">
          <span className={map.winner === 'a' || map.live ? 'text-ink' : 'text-dim'}>
            {map.scoreA}
          </span>
          <span className="text-faint"> – </span>
          <span className={map.winner === 'b' || map.live ? 'text-ink' : 'text-dim'}>
            {map.scoreB}
          </span>
        </span>
      </div>
    ))}
  </div>
);
