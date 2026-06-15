import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateGroup, useJoinGroup } from '../../api/queries/useGroups';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Seg } from '../../components/ui/Seg';
import { GameFilter } from '../filters/GameFilter';
import { TeamFilter } from '../filters/TeamFilter';

const EMOJIS = ['🔥', '🏆', '⚡', '🎮', '💥', '🦅', '👑', '🚀'];

type ScopeMode = 'all' | 'game' | 'team';

const Label = ({ children }: { children: string }) => (
  <label className="text-xs font-bold tracking-wide text-dim uppercase">{children}</label>
);

const inputClass =
  'mt-2 w-full rounded-[13px] border-[1.5px] border-line-2 bg-surface px-4 py-3 text-[15px] font-semibold text-ink outline-none placeholder:text-faint focus:border-accent';

/** Formulaire de création de groupe (nom + emblème + périmètre + aperçu). */
export const CreateGroupForm = () => {
  const navigate = useNavigate();
  const { mutate: create, isPending } = useCreateGroup();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [scopeMode, setScopeMode] = useState<ScopeMode>('all');
  const [gameId, setGameId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);

  const scopeLabel =
    scopeMode === 'game'
      ? 'Matchs du jeu sélectionné'
      : scopeMode === 'team'
        ? "Matchs de l'équipe sélectionnée"
        : 'Tous les matchs';

  const canSubmit =
    scopeMode === 'all' ||
    (scopeMode === 'game' && gameId !== null) ||
    (scopeMode === 'team' && teamId !== null);

  const submit = () =>
    create(
      {
        name,
        emoji,
        gameId: scopeMode === 'game' ? (gameId ?? undefined) : undefined,
        teamId: scopeMode === 'team' ? (teamId ?? undefined) : undefined,
      },
      { onSuccess: (g) => navigate(`/prono/group/${g.id}`, { replace: true }) },
    );

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div>
        <Label>Nom du groupe</Label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Les Clutchers…"
          className={inputClass}
        />
      </div>
      <div>
        <Label>Emblème</Label>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`size-12 cursor-pointer rounded-[13px] border-[1.5px] text-2xl transition-transform active:scale-95 ${
                emoji === e ? 'border-accent bg-accent/8' : 'border-line-2 bg-surface'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Périmètre des matchs</Label>
        <div className="mt-2">
          <Seg
            full
            value={scopeMode}
            onChange={setScopeMode}
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'game', label: 'Jeu' },
              { value: 'team', label: 'Équipe' },
            ]}
          />
        </div>
        {scopeMode === 'game' && (
          <div className="-mx-5 mt-3">
            <GameFilter value={gameId} onChange={setGameId} />
          </div>
        )}
        {scopeMode === 'team' && (
          <div className="-mx-5 mt-3">
            <TeamFilter value={teamId} onChange={setTeamId} />
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3.5">
        <span className="text-3xl leading-none">{emoji}</span>
        <div>
          <div className="text-base font-bold text-ink">{name.trim() || 'Mon groupe'}</div>
          <div className="mt-1 text-xs font-semibold text-dim">
            {scopeLabel} · tu seras le 1ᵉʳ membre
          </div>
        </div>
      </div>
      <Button full size="lg" onClick={submit} disabled={isPending || !canSubmit}>
        <Icon name="plus" size={17} strokeWidth={2.2} />
        {isPending ? 'Création…' : 'Créer le groupe'}
      </Button>
    </div>
  );
};

/** Formulaire pour rejoindre un groupe via code d'invitation. */
export const JoinGroupForm = () => {
  const navigate = useNavigate();
  const { mutate: join, isPending } = useJoinGroup();
  const [code, setCode] = useState('');

  const submit = () =>
    join(code, { onSuccess: (g) => navigate(`/prono/group/${g.id}`, { replace: true }) });

  return (
    <div className="mt-5 flex flex-col gap-5">
      <div>
        <Label>Code d'invitation</Label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CLTCH-XXXX"
          className={`${inputClass} tracking-[.06em] uppercase`}
        />
      </div>
      <div className="flex items-start gap-2.5 rounded-[13px] bg-surface-2 px-4 py-3 text-[12.5px] leading-relaxed font-semibold text-ink-2">
        <Icon name="info" size={16} className="mt-0.5 shrink-0 text-accent" />
        Demande son code à un ami déjà dans le groupe pour le rejoindre.
      </div>
      <Button full size="lg" onClick={submit} disabled={isPending || code.trim() === ''}>
        <Icon name="users" size={17} strokeWidth={2.1} />
        {isPending ? 'Connexion…' : 'Rejoindre le groupe'}
      </Button>
    </div>
  );
};
