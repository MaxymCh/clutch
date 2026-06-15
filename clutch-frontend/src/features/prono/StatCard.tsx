import { formatPoints } from '../../lib/format';
import type { User } from '../../types/community';

/** Carte sombre des stats de prono : points, rang mondial, série. */
export const StatCard = ({ user }: { user: User }) => {
  const cells: [string, string, boolean][] = [
    ['Points', formatPoints(user.points), false],
    ['Rang mondial', `#${formatPoints(user.globalRank)}`, false],
    ['Série', `${user.streak} ✓`, true],
  ];
  return (
    <div className="flex rounded-[20px] bg-ink py-4.5 shadow-card">
      {cells.map(([label, value, accent], i) => (
        <div key={label} className={`flex-1 text-center ${i > 0 ? 'border-l border-surface/15' : ''}`}>
          <div
            className={`text-2xl leading-none font-medium tracking-tight tabular-nums ${
              accent ? 'text-accent' : 'text-surface'
            }`}
          >
            {value}
          </div>
          <div className="mt-2 text-[10.5px] leading-none font-semibold tracking-wide text-surface/60 uppercase">
            {label}
          </div>
        </div>
      ))}
    </div>
  );
};
