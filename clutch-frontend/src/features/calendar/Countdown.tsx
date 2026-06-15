import { useEffect, useState } from "react";
import { Icon } from "../../components/ui/Icon";

type CountdownProps = {
  /** ISO date "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" */
  time: string;
};

/** Compte à rebours vers le prochain match. */
export const Countdown = ({ date, time }: CountdownProps) => {
  const target = new Date(`${date}T${time}:00`).getTime();

  const calc = () => {
    const diff = Math.max(0, target - Date.now());
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    const s = Math.floor((diff % 60_000) / 1_000);
    return { h, m, s, done: diff === 0 };
  };

  const [state, setState] = useState(calc);

  useEffect(() => {
    const id = setInterval(() => setState(calc()), 1_000);
    return () => clearInterval(id);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3 py-1.5 text-xs font-semibold tabular-nums text-ink">
      <Icon name="clock" size={14} strokeWidth={2} />
      {state.done ? (
        <span className="text-accent">Imminent</span>
      ) : (
        <span>
          {pad(state.h)} : {pad(state.m)} : {pad(state.s)}
        </span>
      )}
    </div>
  );
};
