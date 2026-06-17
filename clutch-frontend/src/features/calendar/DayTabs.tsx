import { useEffect, useRef } from "react";
import { LiveDot } from "../../components/ui/Badge";
import { Icon } from "../../components/ui/Icon";
import { formatMonthShort, formatWeekdayShort } from "../../lib/date";

export type DayInfo = {
  /** Date ISO "YYYY-MM-DD" */
  date: string;
  /** Nombre de matchs en direct ce jour-là */
  liveCount: number;
};

/** Valeur spéciale de l'onglet « À venir » (portée par l'URL : ?day=all) */
export const ALL_DAYS = "all";

type DayTabsProps = {
  days: DayInfo[];
  value: string;
  onChange: (date: string) => void;
  /** Affiche le bouton fixe « À venir » à gauche du slider */
  withAll?: boolean;
};

/** Largeur fixe du bouton "À venir" — miroir à droite pour centrer le slider. */
const AVENIR_W = "w-16";

/** Slider de jours : bouton "À venir" fixe + flèches prev/next + scroll centré. */
export const DayTabs = ({
  days,
  value,
  onChange,
  withAll = false,
}: DayTabsProps) => {
  const liveTotal = days.reduce((total, day) => total + day.liveCount, 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const isMounted = useRef(false);

  // Auto-scroll pour centrer l'onglet actif (instant au montage, smooth ensuite)
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
    const behavior = isMounted.current ? "smooth" : "instant";
    isMounted.current = true;
    container.scrollTo({ left: scrollLeft, behavior });
  }, [value]);

  const today = new Date().toISOString().slice(0, 10);
  const isAll = value === ALL_DAYS;
  const currentIndex = days.findIndex((d) => d.date === value);

  const goPrev = () => {
    if (isAll) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const target = days.filter((d) => d.date <= yesterdayStr).at(-1) ?? days[0];
      if (target) onChange(target.date);
      return;
    }
    if (currentIndex > 0) onChange(days[currentIndex - 1].date);
    else if (withAll) onChange(ALL_DAYS);
  };

  const goNext = () => {
    if (isAll) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().slice(0, 10);
      const target = days.find((d) => d.date >= tomorrowStr) ?? days[0];
      if (target) onChange(target.date);
      return;
    }
    if (currentIndex < days.length - 1) onChange(days[currentIndex + 1].date);
  };

  const canGoPrev = isAll ? days.length > 0 : currentIndex > 0 || withAll;
  const canGoNext = isAll ? days.length > 0 : currentIndex < days.length - 1;

  return (
    <div className="flex items-stretch">
      {/* Bouton fixe "À venir" — largeur fixe pour pouvoir le mirorer à droite */}
      {withAll ? (
        <>
          <button
            role="tab"
            aria-selected={isAll}
            onClick={() => onChange(ALL_DAYS)}
            className={`${AVENIR_W} shrink-0 cursor-pointer flex flex-col items-center justify-center gap-0.5 py-2 mx-1 rounded-xl transition-all active:scale-95 ${
              isAll ? "bg-ink text-surface" : "text-dim hover:text-ink"
            }`}
          >
            <span className="text-[10px] font-medium">À venir</span>
            <span className="flex items-center gap-1 text-sm font-bold">
              ∞{liveTotal > 0 && <LiveDot size={5} />}
            </span>
          </button>
          <div className="w-px shrink-0 self-stretch bg-line my-1.5" />
        </>
      ) : null}

      {/* Flèche précédent */}
      <button
        onClick={goPrev}
        disabled={!canGoPrev}
        aria-label="Jour précédent"
        className="grid shrink-0 size-8 self-center cursor-pointer place-items-center rounded-lg text-dim transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-25"
      >
        <Icon name="chevron" size={16} strokeWidth={2.5} className="rotate-180" />
      </button>

      {/* Onglets défilants — spacers 50% pour centrer même le 1er/dernier onglet */}
      <div
        ref={containerRef}
        className="scrollbar-none flex flex-1 min-w-0 items-center gap-1 overflow-x-auto"
        role="tablist"
      >
        <span className="shrink-0 w-[50%]" aria-hidden="true" />
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
              <span className="text-[9px] font-medium opacity-70">
                {formatMonthShort(day.date)}
              </span>
            </button>
          );
        })}
        <span className="shrink-0 w-[50%]" aria-hidden="true" />
      </div>

      {/* Flèche suivant */}
      <button
        onClick={goNext}
        disabled={!canGoNext}
        aria-label="Jour suivant"
        className="grid shrink-0 size-8 self-center cursor-pointer place-items-center rounded-lg text-dim transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-25"
      >
        <Icon name="chevron" size={16} strokeWidth={2.5} />
      </button>

      {/* Spacer miroir de "À venir" pour rééquilibrer le centrage du slider */}
      {withAll && <div className={`${AVENIR_W} shrink-0`} aria-hidden="true" />}
    </div>
  );
};
