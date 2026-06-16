import { useEffect, useRef } from 'react';
import { Avatar } from '../../../components/ui/Avatar';
import { Icon } from '../../../components/ui/Icon';

const MAX_PSEUDO = 20;

const nameToTag = (name: string): string => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words.map((w) => w[0]).join('').toUpperCase().slice(0, 3) || name.slice(0, 3).toUpperCase() || '?';
};

type PseudoStepProps = { pseudo: string; onChange: (v: string) => void; error?: string | null };

export const PseudoStep = ({ pseudo, onChange, error }: PseudoStepProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const tag = nameToTag(pseudo);
  const remaining = MAX_PSEUDO - pseudo.length;

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 120);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-4">
      <span className="mb-5 grid size-16 place-items-center rounded-[18px] bg-accent text-on-accent shadow-[0_10px_30px] shadow-accent/30">
        <Icon name="bolt" size={32} strokeWidth={2.2} />
      </span>

      <h2 className="text-[26px] leading-tight font-semibold tracking-tighter text-ink text-center">
        Bienvenue sur Clutch !
      </h2>
      <p className="mt-2 mb-7 text-[13px] leading-snug font-medium text-dim text-center max-w-64">
        Comment tu veux t'appeler dans l'app ?
      </p>

      <div className="w-full max-w-xs">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={pseudo}
            onChange={(e) => { onChange(e.target.value.slice(0, MAX_PSEUDO)); }}
            placeholder="Ton pseudo…"
            className={`w-full rounded-2xl border-[1.5px] bg-surface px-4 py-3.5 text-[15px] font-semibold text-ink placeholder:font-medium placeholder:text-faint outline-none transition-all focus:ring-2 ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : 'border-line-2 focus:border-accent focus:ring-accent/15'}`}
          />
          <span className={`absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold tabular-nums ${remaining <= 4 ? 'text-accent' : 'text-faint'}`}>
            {remaining}
          </span>
        </div>

        {error && <p className="mt-2 text-[12px] font-semibold text-red-500">{error}</p>}

        {pseudo.trim().length >= 2 && !error && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
            <Avatar tag={tag} size={36} me />
            <div>
              <p className="text-[13px] font-bold text-ink leading-none">{pseudo.trim()}</p>
              <p className="mt-1 text-[11px] font-semibold text-dim">{tag} · 0 pts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
