import type { Team } from '../../../../types/esports';

const SIDE_STYLE: Record<string, string> = {
  ct:  'bg-blue-500/15 text-blue-500',
  t:   'bg-yellow-500/15 text-yellow-600',
  atk: 'bg-orange-500/15 text-orange-500',
  def: 'bg-blue-500/15 text-blue-500',
};
const SIDE_LABEL: Record<string, string> = { ct: 'CT', t: 'T', atk: 'ATK', def: 'DEF' };
const halfLabel = (i: number) => (i === 0 ? '1re MT' : i === 1 ? '2e MT' : `OT ${i - 1}`);

/** Mi-temps avec côtés CT/T (CS2) ou ATK/DEF (R6) — commun aux deux jeux. */
export const HalfBreakdown = ({
  halvesA, halvesB, teamA, teamB, vod,
}: {
  halvesA?: { side: string; score: number }[];
  halvesB?: { side: string; score: number }[];
  teamA: Team; teamB: Team; vod?: string;
}) => {
  const count = Math.max(halvesA?.length ?? 0, halvesB?.length ?? 0);
  if (count === 0) return null;

  const sideBadge = (side: string) => (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SIDE_STYLE[side] ?? 'bg-surface-2 text-dim'}`}>
      {SIDE_LABEL[side] ?? side}
    </span>
  );

  return (
    <div className="mt-3 rounded-2xl border border-line bg-surface p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-bold text-ink">{teamA.tag}</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-faint">Mi-temps</span>
        <span className="text-[12px] font-bold text-ink">{teamB.tag}</span>
      </div>
      {Array.from({ length: count }).map((_, i) => {
        const hA = halvesA?.[i];
        const hB = halvesB?.[i];
        return (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className="flex flex-1 items-center justify-end gap-2">
              {hA && sideBadge(hA.side)}
              <span className="w-6 text-right text-[17px] font-bold tabular-nums text-ink">{hA?.score ?? 0}</span>
            </div>
            <span className="w-14 text-center text-[10px] font-semibold text-faint">{halfLabel(i)}</span>
            <div className="flex flex-1 items-center gap-2">
              <span className="w-6 text-left text-[17px] font-bold tabular-nums text-ink">{hB?.score ?? 0}</span>
              {hB && sideBadge(hB.side)}
            </div>
          </div>
        );
      })}
      {vod && (
        <a
          href={vod}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 py-2.5 text-[13px] font-semibold text-ink transition-opacity hover:opacity-70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          Regarder la VOD
        </a>
      )}
    </div>
  );
};
