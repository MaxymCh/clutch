import { useEffect, useRef } from "react";
import { LiveDot } from "../../components/ui/Badge";
import { formatWeekdayShort } from "../../lib/date";

export type DayInfo = {
  /** Date ISO "YYYY-MM-DD" */
  date: string;
  /** Nombre de matchs en direct ce jour-là */
  liveCount: number;
};

/** Valeur spéciale de l'onglet « Tous » (portée par l'URL : ?day=all) */
export const ALL_DAYS = "all";

type DayTabsProps = {
  days: DayInfo[];
  value: string;
  onChange: (date: string) => void;
  /** Affiche l'onglet « Tous » avant les jours (vue multi-jours) */
  withAll?: boolean;
};

/** Calendrier horizontal — jour sélectionné centré automatiquement. */
export const DayTabs = ({
  days,
  value,
  onChange,
  withAll = false,
}: DayTabsProps) => {
  const liveTotal = days.reduce((total, day) => total + day.liveCount, 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll pour centrer l'onglet actif
  useEffect(() => {
    const container = containerRef.current;
    const activeTab = activeRef.current;
    if (!container || !activeTab) return;
    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const scrollLeft =
      container.scrollLeft +
      tabRect.left -
      containerRect.left -
      containerRect.width / 2 +
      tabRect.width / 2;
    container.scrollTo({ left: scrollLeft, behavior: "smooth" });
  }, [value]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div
      ref={containerRef}
      className="scrollbar-none flex items-center gap-1 overflow-x-auto px-[30%]"
      role="tablist"
    >
      {withAll && (
        <button
          ref={value === ALL_DAYS ? activeRef : undefined}
          role="tab"
          aria-selected={value === ALL_DAYS}
          onClick={() => onChange(ALL_DAYS)}
          className={`flex shrink-0 cursor-pointer flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-all active:scale-95 ${
            value === ALL_DAYS
              ? "bg-ink text-surface"
              : "text-dim hover:text-ink"
          }`}
        >
          <span className="text-[11px] font-medium">Tous</span>
          <span className="flex items-center gap-1 text-base font-bold">
            ∞{liveTotal > 0 && <LiveDot size={5} />}
          </span>
        </button>
      )}
      {days.map((day) => {
        const active = day.date === value;
        const isToday = day.date === today;
        const dayNum = day.date.slice(8);
        return (
          <button
            key={day.date}
            ref={active ? activeRef : undefined}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(day.date)}
            className={`flex shrink-0 cursor-pointer flex-col items-center gap-0.5 rounded-xl px-4 py-2.5 transition-all active:scale-95 ${
              active
                ? "bg-ink text-surface"
                : isToday
                  ? "text-accent"
                  : "text-dim hover:text-ink"
            }`}
          >
            <span className="text-[11px] font-medium">
              {isToday
                ? "Auj."
                : formatWeekdayShort(day.date).toLowerCase() + "."}
            </span>
            <span className="flex items-center gap-1 text-base font-bold">
              {dayNum}
              {day.liveCount > 0 && <LiveDot size={5} />}
            </span>
          </button>
        );
      })}
    </div>
  );
};
