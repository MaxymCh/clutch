import type { ReactNode } from 'react';
import { LiveDot } from '../../components/ui/Badge';
import { formatDayMonth, formatWeekdayShort } from '../../lib/date';

export type DayInfo = {
  /** Date ISO "YYYY-MM-DD" */
  date: string;
  /** Nombre de matchs en direct ce jour-là */
  liveCount: number;
};

/** Valeur spéciale de l'onglet « Tous » (portée par l'URL : ?day=all) */
export const ALL_DAYS = 'all';

type DayTabsProps = {
  days: DayInfo[];
  value: string;
  onChange: (date: string) => void;
  /** Affiche l'onglet « Tous » avant les jours (vue multi-jours) */
  withAll?: boolean;
};

/** Pastille d'onglet commune (jour ou « Tous »). */
const Tab = ({
  active,
  onClick,
  top,
  bottom,
}: {
  active: boolean;
  onClick: () => void;
  top: ReactNode;
  bottom: string;
}) => (
  <button
    role="tab"
    aria-selected={active}
    onClick={onClick}
    className={`shrink-0 cursor-pointer rounded-[14px] border-[1.5px] px-3 py-2 text-left transition-transform active:scale-[.97] ${
      active ? 'border-ink bg-ink' : 'border-line-2 bg-transparent'
    }`}
  >
    <span
      className={`flex items-center gap-1.5 text-[13px] leading-none font-bold tracking-tight ${
        active ? 'text-surface' : 'text-ink'
      }`}
    >
      {top}
    </span>
    <span
      className={`mt-1 block text-[10.5px] leading-none font-medium ${
        active ? 'text-surface/70' : 'text-dim'
      }`}
    >
      {bottom}
    </span>
  </button>
);

/** Onglets de jours du tournoi — pastille live si un match est en cours. */
export const DayTabs = ({ days, value, onChange, withAll = false }: DayTabsProps) => {
  const liveTotal = days.reduce((total, day) => total + day.liveCount, 0);
  return (
    <div className="scrollbar-none flex gap-2 overflow-x-auto px-5" role="tablist">
      {withAll && (
        <Tab
          active={value === ALL_DAYS}
          onClick={() => onChange(ALL_DAYS)}
          top={
            <>
              Tous
              {liveTotal > 0 && <LiveDot size={6} />}
            </>
          }
          bottom="le tournoi"
        />
      )}
      {days.map((day) => (
        <Tab
          key={day.date}
          active={day.date === value}
          onClick={() => onChange(day.date)}
          top={
            <>
              {formatWeekdayShort(day.date)}
              {day.liveCount > 0 && <LiveDot size={6} />}
            </>
          }
          bottom={formatDayMonth(day.date)}
        />
      ))}
    </div>
  );
};
