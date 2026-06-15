import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGroup, useGroupHistory } from '../api/queries/useGroups';
import { Page } from '../components/layout/Page';
import { TopBar } from '../components/layout/TopBar';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { PageSpinner } from '../components/ui/Spinner';
import { GroupScopeBadge } from '../features/prono/GroupScope';
import { RankRow } from '../features/prono/RankRow';

/** Détail d'un groupe de pronostics : /prono/group/:id */
export const GroupPage = () => {
  const { id = '' } = useParams();
  const { data: group, isPending, isError } = useGroup(id);
  const { data: history = [], isPending: isHistoryPending } = useGroupHistory(id);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!group) return;
    navigator.clipboard?.writeText(group.code).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const ranked = group ? [...group.members].sort((a, b) => b.points - a.points) : [];

  return (
    <Page>
      <TopBar title={group?.name ?? 'Groupe'} />
      {isPending && <PageSpinner />}
      {isError && (
        <p className="px-5 py-16 text-center text-sm font-medium text-dim">Groupe introuvable.</p>
      )}
      {group && (
        <div className="px-5">
          <div className="flex flex-col items-center gap-2.5 border-b border-line pt-3 pb-5">
            <span className="text-[44px] leading-none">{group.emoji}</span>
            <h1 className="text-[22px] leading-none font-bold tracking-tight text-ink">
              {group.name}
            </h1>
            <p className="text-xs leading-none font-semibold text-dim">
              {group.members.length} membres
            </p>
            <GroupScopeBadge group={group} />
            <button
              onClick={copy}
              className="mt-1 inline-flex cursor-pointer items-center gap-2 rounded-xl border-[1.5px] border-line-2 bg-surface px-3.5 py-2.5 text-[13px] font-bold text-ink transition-transform active:scale-[.97]"
            >
              <Icon name={copied ? 'check' : 'copy'} size={15} className={copied ? 'text-accent' : 'text-dim'} />
              {copied ? (
                'Code copié !'
              ) : (
                <>
                  Code : <span className="tracking-wide text-accent">{group.code}</span>
                </>
              )}
            </button>
          </div>

          <h2 className="mt-5 mb-1 text-[11px] font-bold tracking-[.1em] text-dim uppercase">
            Classement du groupe
          </h2>
          {ranked.map((member, i) => (
            <RankRow
              key={member.name}
              rank={i + 1}
              name={member.name}
              tag={member.tag}
              points={member.points}
              isMe={member.isMe}
              topHighlight={i === 0}
            />
          ))}

          <div className="mt-4.5">
            <Button full variant="ghost" onClick={copy}>
              <Icon name="share" size={17} strokeWidth={2} />
              Inviter des amis
            </Button>
          </div>

          <h2 className="mt-7 mb-1 text-[11px] font-bold tracking-[.1em] text-dim uppercase">
            Historique des matchs terminés
          </h2>
          {isHistoryPending && <p className="py-4 text-sm font-medium text-dim">Chargement…</p>}
          {!isHistoryPending && history.length === 0 && (
            <p className="py-4 text-sm font-medium text-dim">
              Aucun match terminé pour l'instant.
            </p>
          )}
          <div className="space-y-3 pb-6">
            {history.map(({ match, members }) => (
              <article key={match.id} className="rounded-3xl border border-line-2 bg-surface p-4 shadow-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold tracking-[.1em] text-dim uppercase">
                      {match.gameId.toUpperCase()} · {match.phase}
                    </p>
                    <h3 className="mt-1 text-sm font-bold text-ink">
                      {match.teamA.tag} vs {match.teamB.tag}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-dim">
                      {match.date} · {match.time}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-ink px-3 py-2 text-right text-white">
                    <div className="text-xs font-bold uppercase tracking-[.1em] opacity-70">Score</div>
                    <div className="text-lg font-black leading-none">
                      {match.scoreA ?? 0} - {match.scoreB ?? 0}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {members.map((member) => (
                    <div
                      key={`${match.id}-${member.tag}`}
                      className={`flex items-center justify-between rounded-2xl px-3 py-2 text-sm ${
                        member.isMe ? 'bg-accent/10 text-ink' : 'bg-cream text-ink'
                      }`}
                    >
                      <div>
                        <div className="font-bold">
                          {member.name}
                          {member.isMe ? ' · moi' : ''}
                        </div>
                        <div className="text-xs font-medium text-dim">
                          {member.prediction
                            ? `${member.prediction.pick === 'a' ? match.teamA.tag : match.teamB.tag} · ${member.prediction.scoreA}-${member.prediction.scoreB}`
                            : 'Aucun prono'}
                        </div>
                      </div>
                      <div className="text-right font-black text-accent">
                        {member.points ?? 0} pt{(member.points ?? 0) > 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </Page>
  );
};
