import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useGames } from "../api/queries/useGames";
import {
  useDeleteGroup,
  useGroup,
  useGroupHistory,
  useLeaveGroup,
  useRemoveMember,
} from "../api/queries/useGroups";
import { useMatches } from "../api/queries/useMatches";
import { Avatar } from "../components/ui/Avatar";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Page } from "../components/layout/Page";
import { TopBar } from "../components/layout/TopBar";
import { Icon } from "../components/ui/Icon";
import { Seg } from "../components/ui/Seg";
import { Sheet } from "../components/ui/Sheet";
import { PageSpinner } from "../components/ui/Spinner";
import { filterMatchesByGroupScope } from "../features/filters/filterMatches";
import { PredictCard } from "../features/prono/PredictCard";
import { PredictSheet } from "../features/prono/PredictSheet";
import { RankRow } from "../features/prono/RankRow";
import { getGroupScopeLabel } from "../features/prono/groupScopeLabel";
import { formatPoints } from "../lib/format";
import type { Match } from "../types/esports";

/** Détail d'une ligue : /ligues/:id */
export const GroupPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { data: group, isPending, isError } = useGroup(id);
  const { data: history = [], isPending: isHistoryPending } =
    useGroupHistory(id);
  const { data: matches, isPending: isMatchesPending } = useMatches();
  const { data: games } = useGames();
  const { mutate: deleteGroupFn, isPending: isDeleting } = useDeleteGroup();
  const { mutate: leaveGroupFn, isPending: isLeaving } = useLeaveGroup();
  const { mutate: removeMemberFn } = useRemoveMember();
  const [copied, setCopied] = useState(false);
  const [predicting, setPredicting] = useState<Match | null>(null);
  const [tab, setTab] = useState<"pronos" | "classement">("pronos");
  const [showSettings, setShowSettings] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [confirmKick, setConfirmKick] = useState<{
    name: string;
    tag: string;
  } | null>(null);

  const upcoming = useMemo(() => {
    if (!group) return [];
    return filterMatchesByGroupScope(
      (matches ?? []).filter((m) => m.status === "upcoming"),
      group,
    );
  }, [matches, group]);

  const copy = () => {
    if (!group) return;
    navigator.clipboard?.writeText(group.code).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const ranked = group
    ? [...group.members].sort((a, b) => b.points - a.points)
    : [];
  const tagOf = (m: Match) =>
    games?.find((g) => g.id === m.gameId)?.tag ?? m.gameId.toUpperCase();
  const scopeLabel = group ? getGroupScopeLabel(group, games) : "";

  return (
    <Page>
      <TopBar title={group?.name ?? "Ligue"} />
      {isPending && <PageSpinner />}
      {isError && (
        <p className="px-5 py-16 text-center text-sm font-medium text-dim">
          Ligue introuvable.
        </p>
      )}
      {group && (
        <div className="px-5">
          {/* Header — tout sur une ligne : nom | invite | réglages */}
          <div className="flex items-center gap-3 border-b border-line py-3">
            {/* Gauche — emoji + nom + infos */}
            <span className="text-[26px] leading-none">{group.emoji}</span>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-bold tracking-tight text-ink">
                {group.name}
              </h1>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-dim">
                <span>{group.members.length} joueurs</span>
                <span className="size-0.5 rounded-full bg-dim" />
                <span className="text-accent">{scopeLabel}</span>
              </p>
            </div>

            {/* Milieu — code + copier */}
            <button
              onClick={copy}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-surface-2 px-2.5 py-1.5 text-[11px] font-bold text-ink transition-transform active:scale-[.97]"
            >
              <Icon name={copied ? "check" : "copy"} size={12} />
              {copied ? "Copié !" : group.code}
            </button>

            {/* Droite — Réglages */}
            <button
              onClick={() => setShowSettings(true)}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-surface-2 px-3 py-1.5 text-[11px] font-bold text-dim transition-transform active:scale-[.97]"
            >
              <Icon name="filter" size={13} />
              Réglages
            </button>
          </div>

          {/* ─── Sheet Réglages ─── */}

          {/* ─── Sheet Réglages ─── */}
          <Sheet
            open={showSettings}
            onClose={() => setShowSettings(false)}
            title="Réglages"
          >
            <div className="flex flex-col gap-2">
              {/* Copier le code */}
              <button
                onClick={() => {
                  copy();
                  setShowSettings(false);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-surface-2 px-4 py-3.5 text-left transition-transform active:scale-[.98]"
              >
                <Icon name="copy" size={18} className="shrink-0 text-dim" />
                <span className="flex-1 text-[14px] font-semibold text-ink">
                  Copier le code
                </span>
                <span className="text-[13px] font-bold tracking-wide text-dim">
                  {group.code}
                </span>
              </button>

              {/* Supprimer des participants (admin) */}
              {group.isAdmin && (
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setTimeout(() => setShowMembers(true), 200);
                  }}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-surface-2 px-4 py-3.5 text-left transition-transform active:scale-[.98]"
                >
                  <Icon name="users" size={18} className="shrink-0 text-dim" />
                  <span className="flex-1 text-[14px] font-semibold text-ink">
                    Supprimer des participants
                  </span>
                  <Icon
                    name="chevron"
                    size={16}
                    className="shrink-0 text-dim -rotate-90"
                  />
                </button>
              )}

              {/* Sortir de la ligue */}
              <button
                onClick={() => {
                  setShowSettings(false);
                  setTimeout(() => setConfirmLeave(true), 200);
                }}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl bg-surface-2 px-4 py-3.5 text-left transition-transform active:scale-[.98]"
              >
                <Icon
                  name="close"
                  size={18}
                  className="shrink-0 text-red-500"
                />
                <span className="flex-1 text-[14px] font-semibold text-red-500">
                  {group.isAdmin
                    ? "Supprimer la ligue"
                    : "Sortir de cette ligue"}
                </span>
                <Icon
                  name="chevron"
                  size={16}
                  className="shrink-0 text-dim -rotate-90"
                />
              </button>
            </div>
          </Sheet>

          {/* ─── Sheet Gestion membres ─── */}
          <Sheet
            open={showMembers}
            onClose={() => setShowMembers(false)}
            title="Participants"
          >
            <div className="flex flex-col gap-2">
              {group.members.map((m) => (
                <div
                  key={m.tag}
                  className="flex items-center gap-3 rounded-xl bg-surface-2 px-4 py-3"
                >
                  <Avatar tag={m.tag} size={32} me={m.isMe} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink">
                      {m.name}
                    </p>
                    <p className="text-[11px] font-medium text-dim">@{m.tag}</p>
                  </div>
                  {m.isMe ? (
                    <span className="rounded-lg bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                      Admin
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setShowMembers(false);
                        setTimeout(
                          () => setConfirmKick({ name: m.name, tag: m.tag }),
                          200,
                        );
                      }}
                      className="cursor-pointer rounded-lg bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-500 transition-transform active:scale-95"
                    >
                      Expulser
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Sheet>

          {/* ─── Modales de confirmation ─── */}
          <ConfirmModal
            open={confirmLeave}
            onClose={() => setConfirmLeave(false)}
            title={
              group.isAdmin ? "Supprimer la ligue ?" : "Quitter la ligue ?"
            }
            description={
              group.isAdmin
                ? "Cette action est irréversible. Tous les membres seront retirés et les données de la ligue supprimées."
                : "Tu ne pourras plus voir le classement ni les pronos de cette ligue."
            }
            confirmLabel={group.isAdmin ? "Supprimer" : "Quitter"}
            destructive
            loading={group.isAdmin ? isDeleting : isLeaving}
            onConfirm={() => {
              if (group.isAdmin) {
                deleteGroupFn(id, {
                  onSuccess: () => navigate("/ligues", { replace: true }),
                });
              } else {
                leaveGroupFn(id, {
                  onSuccess: () => navigate("/ligues", { replace: true }),
                });
              }
            }}
          />

          <ConfirmModal
            open={!!confirmKick}
            onClose={() => setConfirmKick(null)}
            title={`Expulser ${confirmKick?.name} ?`}
            description="Ce joueur sera retiré de la ligue. Il pourra la rejoindre à nouveau avec le code."
            confirmLabel="Expulser"
            destructive
            onConfirm={() => {
              if (confirmKick) {
                removeMemberFn({ groupId: id, memberTag: confirmKick.tag });
                setConfirmKick(null);
              }
            }}
          />

          {/* Tabs */}
          <div className="pt-4 pb-3">
            <Seg
              full
              value={tab}
              onChange={setTab}
              options={[
                { value: "pronos", label: "Pronos" },
                { value: "classement", label: "Classement" },
              ]}
            />
          </div>

          {/* ─── Onglet Pronos ─── */}
          {tab === "pronos" && (
            <>
              <h2 className="pt-2 pb-3 text-base leading-none font-bold tracking-tight text-ink">
                À pronostiquer{" "}
                <span className="text-faint">{upcoming.length}</span>
              </h2>
              {isMatchesPending && <PageSpinner />}
              {!isMatchesPending && upcoming.length === 0 && (
                <p className="py-8 text-center text-sm font-medium text-dim">
                  Aucun match à venir dans cette ligue.
                </p>
              )}
              <div className="flex flex-col gap-3 pb-4">
                {upcoming.map((m) => (
                  <PredictCard
                    key={m.id}
                    match={m}
                    gameTag={tagOf(m)}
                    onPredict={setPredicting}
                  />
                ))}
              </div>

              {/* Historique résumé */}
              {(isHistoryPending || history.length > 0) && (
                <>
                  <h2 className="pt-4 pb-3 text-base leading-none font-bold tracking-tight text-ink">
                    Matchs terminés{" "}
                    <span className="text-faint">{history.length}</span>
                  </h2>
                  {isHistoryPending && <PageSpinner />}
                  <div className="space-y-3 pb-6">
                    {history.map(({ match, members }) => (
                      <div
                        key={match.id}
                        className="rounded-xl border border-line bg-surface-2 px-4 py-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-ink">
                              {match.teamA.tag} vs {match.teamB.tag}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-dim">
                              {tagOf(match)} · {match.phase}
                            </p>
                          </div>
                          <span className="shrink-0 text-[15px] font-bold tabular-nums text-ink">
                            {match.scoreA ?? 0}–{match.scoreB ?? 0}
                          </span>
                        </div>
                        {/* Pronos des membres */}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {members.map((member) => (
                            <span
                              key={`${match.id}-${member.tag}`}
                              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-bold ${
                                member.isMe
                                  ? "bg-accent/10 text-accent"
                                  : "bg-surface text-dim"
                              }`}
                            >
                              {member.name}
                              {member.isMe ? " (moi)" : ""}
                              {member.prediction
                                ? ` ${member.prediction.scoreA}-${member.prediction.scoreB}`
                                : " —"}
                              {(member.points ?? 0) > 0 && (
                                <span className="text-accent">
                                  +{member.points}
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ─── Onglet Classement ─── */}
          {tab === "classement" && (
            <>
              {/* Podium */}
              {ranked.length >= 3 && (
                <div className="flex items-end justify-center gap-3 pt-2 pb-6">
                  {[ranked[1], ranked[0], ranked[2]].map((member, i) => {
                    const isFirst = i === 1;
                    const rank = isFirst ? 1 : i === 0 ? 2 : 3;
                    return (
                      <div
                        key={member.name}
                        className="flex flex-col items-center gap-1.5"
                      >
                        <div className="relative">
                          <Avatar tag={member.tag} size={isFirst ? 56 : 44} />
                          <span
                            className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 grid size-5 place-items-center rounded-full text-[10px] font-black text-white ${
                              rank === 1 ? "bg-accent" : "bg-dim"
                            }`}
                          >
                            {rank}
                          </span>
                        </div>
                        <span
                          className={`max-w-20 truncate text-center font-bold text-ink ${isFirst ? "text-[13px]" : "text-[11px]"}`}
                        >
                          {member.name}
                          {member.isMe && (
                            <span className="text-accent"> ·toi</span>
                          )}
                        </span>
                        <span
                          className={`font-bold tabular-nums text-accent ${isFirst ? "text-base" : "text-[13px]"}`}
                        >
                          {formatPoints(member.points)} Pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ma position */}
              {ranked.find((m) => m.isMe) && (
                <div className="mb-4 rounded-xl border border-accent/20 bg-accent/5">
                  <RankRow
                    rank={ranked.findIndex((m) => m.isMe) + 1}
                    name={ranked.find((m) => m.isMe)!.name}
                    tag={ranked.find((m) => m.isMe)!.tag}
                    points={ranked.find((m) => m.isMe)!.points}
                    isMe
                  />
                </div>
              )}

              {/* Liste complète */}
              <div className="pb-6">
                {ranked.map((member, i) => (
                  <RankRow
                    key={member.name}
                    rank={i + 1}
                    name={member.name}
                    tag={member.tag}
                    points={member.points}
                    isMe={member.isMe}
                    topHighlight={i < 3}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <PredictSheet match={predicting} onClose={() => setPredicting(null)} />
    </Page>
  );
};
