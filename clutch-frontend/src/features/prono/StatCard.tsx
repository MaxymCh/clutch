import { Icon } from "../../components/ui/Icon";
import { formatPoints } from "../../lib/format";
import type { User } from "../../types/community";

/** Carte stats de prono — 3 colonnes avec icône + valeur + label. */
export const StatCard = ({ user }: { user: User }) => {
  const cells: {
    label: string;
    value: string;
    icon: "bolt" | "trend" | "trophy";
  }[] = [
    { label: "Points", value: formatPoints(user.points), icon: "bolt" },
    {
      label: "Rang",
      value: `#${formatPoints(user.globalRank)}`,
      icon: "trend",
    },
    { label: "Série", value: `${user.streak} ✓`, icon: "trophy" },
  ];
  return (
    <div className="flex rounded-2xl border border-line bg-surface-2 py-4">
      {cells.map(({ label, value, icon }, i) => (
        <div
          key={label}
          className={`flex flex-1 flex-col items-center gap-1.5 ${i > 0 ? "border-l border-line" : ""}`}
        >
          <span className="grid size-8 place-items-center rounded-lg bg-accent/10">
            <Icon
              name={icon}
              size={16}
              strokeWidth={2.2}
              className="text-accent"
            />
          </span>
          <span className="text-xl font-bold leading-none tracking-tight tabular-nums text-ink">
            {value}
          </span>
          <span className="text-[10px] font-semibold tracking-wider text-dim uppercase">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
};
