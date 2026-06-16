import { useState } from 'react';
import { useTeams } from '../../../api/queries/useTeams';
import { Icon } from '../../../components/ui/Icon';
import { TeamLogo } from '../../../components/ui/TeamLogo';
import { useFavorites } from '../../favorites/favoritesContext';
import { StepTitle } from './StepTitle';

const toFlag = (code: string) =>
  [...code.toUpperCase()].map((c) => String.fromCodePoint(c.charCodeAt(0) + 127397)).join('');

export const TeamsStep = () => {
  const { data: teams } = useTeams();
  const { teams: favTeams, toggleTeam } = useFavorites();
  const [query, setQuery] = useState('');

  const filtered = (teams ?? []).filter((t) => {
    const q = query.toLowerCase();
    return t.name.toLowerCase().includes(q) || t.tag.toLowerCase().includes(q);
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col px-6 pt-2">
      <StepTitle title="Tes équipes favorites" sub="Filtre rapide + accès direct à leurs matchs." />

      {/* Barre de recherche */}
      <div className="relative mb-4 shrink-0">
        <Icon
          name="search"
          size={16}
          strokeWidth={2}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une équipe…"
          className="w-full rounded-2xl border-[1.5px] border-line-2 bg-surface py-2.5 pl-9 pr-4 text-[13px] font-medium text-ink placeholder:text-faint outline-none transition-all focus:border-accent focus:ring-2 focus:ring-accent/15"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-faint hover:text-dim"
            aria-label="Effacer la recherche"
          >
            <Icon name="close" size={14} strokeWidth={2.2} />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2 pb-4">
          {filtered.map((team) => {
            const on = favTeams.includes(team.id);
            return (
              <button
                key={team.id}
                onClick={() => toggleTeam(team.id)}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border-[1.5px] px-3 py-3 text-left transition-all duration-150 active:scale-[.97] ${
                  on ? 'border-accent bg-accent/8' : 'border-line-2 bg-surface'
                }`}
              >
                <TeamLogo tag={team.tag} size={36} solid={on} logoUrl={team.logoUrl} />
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[12px] font-bold leading-tight ${on ? 'text-accent' : 'text-ink'}`}>
                    {team.name}
                  </p>
                  <p className="mt-0.5 text-[10.5px] font-semibold text-dim">
                    {toFlag(team.countryCode)} {team.tag}
                  </p>
                </div>
                {on && (
                  <div className="grid size-5 shrink-0 place-items-center rounded-full bg-accent">
                    <Icon name="check" size={11} strokeWidth={2.8} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}

          {filtered.length === 0 && query && (
            <p className="col-span-2 py-8 text-center text-[13px] font-medium text-faint">
              Aucune équipe pour « {query} »
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
