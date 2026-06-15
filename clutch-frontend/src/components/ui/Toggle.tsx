type ToggleProps = {
  on: boolean;
  onChange: (on: boolean) => void;
  /** Libellé pour les lecteurs d'écran */
  label?: string;
};

/** Interrupteur on/off — orange quand actif. */
export const Toggle = ({ on, onChange, label }: ToggleProps) => (
  <button
    role="switch"
    aria-checked={on}
    aria-label={label}
    onClick={() => onChange(!on)}
    className={`relative h-7 w-[46px] shrink-0 cursor-pointer rounded-full transition-colors ${
      on ? 'bg-accent' : 'bg-line-2'
    }`}
  >
    <span
      className={`absolute top-[3px] size-[22px] rounded-full bg-surface shadow-card transition-[left] ${
        on ? 'left-[21px]' : 'left-[3px]'
      }`}
    />
  </button>
);
