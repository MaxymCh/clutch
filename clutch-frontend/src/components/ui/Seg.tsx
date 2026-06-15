type SegOption<T extends string> = { value: T; label: string };

type SegProps<T extends string> = {
  options: SegOption<T>[];
  value: T;
  onChange: (value: T) => void;
  full?: boolean;
};

/** Contrôle segmenté (pilule) — l'option active flotte sur fond blanc. */
export const Seg = <T extends string>({ options, value, onChange, full = false }: SegProps<T>) => (
  <div
    className={`inline-flex gap-0.5 rounded-full bg-surface-2 p-[3px] ${full ? 'w-full' : ''}`}
    role="tablist"
  >
    {options.map((option) => {
      const active = option.value === value;
      return (
        <button
          key={option.value}
          role="tab"
          aria-selected={active}
          onClick={() => onChange(option.value)}
          className={`cursor-pointer rounded-full px-4 py-2.5 text-[13.5px] leading-none tracking-tight whitespace-nowrap transition-transform active:scale-[.97] ${
            full ? 'flex-1' : ''
          } ${active ? 'bg-surface font-bold text-ink shadow-card' : 'font-semibold text-dim'}`}
        >
          {option.label}
        </button>
      );
    })}
  </div>
);
