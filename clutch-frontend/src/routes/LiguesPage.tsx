import { Link } from "react-router-dom";
import { useGroups } from "../api/queries/useGroups";
import { Page } from "../components/layout/Page";
import { Icon } from "../components/ui/Icon";
import { PageSpinner } from "../components/ui/Spinner";

/** Page "Mes ligues" : liste des groupes, créer, rejoindre. */
export const LiguesPage = () => {
  const { data: groups, isPending } = useGroups();

  const hasGroups = (groups ?? []).length > 0;

  return (
    <Page>
      {/* Header */}
      <div className="px-5 pt-4 pb-3">
        <h1 className="text-[24px] leading-none font-semibold tracking-tighter text-ink">
          Mes ligues
        </h1>
        <p className="mt-1.5 text-[13px] leading-none font-medium text-dim">
          Crée ou rejoins un groupe pour défier tes amis
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 px-5 pb-5">
        <Link
          to="/ligues/create"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-[13px] font-bold text-on-accent transition-transform active:scale-[.97]"
        >
          <Icon name="plus" size={15} strokeWidth={2.4} />
          Créer une ligue
        </Link>
        <Link
          to="/ligues/join"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-surface-2 px-4 py-3 text-[13px] font-bold text-ink transition-transform active:scale-[.97]"
        >
          <Icon name="users" size={15} strokeWidth={2} />
          Rejoindre
        </Link>
      </div>

      <div className="h-px bg-line" />

      {/* Liste des ligues */}
      <div className="px-5 pt-4">
        {isPending && <PageSpinner />}

        {!isPending && !hasGroups && (
          <div className="flex flex-col items-center gap-4 py-14 text-center">
            <span className="grid size-16 place-items-center rounded-3xl bg-accent/10 text-accent">
              <Icon name="users" size={32} strokeWidth={1.5} />
            </span>
            <div>
              <p className="text-base font-bold text-ink">Aucune ligue</p>
              <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed font-medium text-dim">
                Crée ta première ligue et invite tes amis pour vous affronter
                sur vos pronos.
              </p>
            </div>
          </div>
        )}

        {hasGroups && (
          <div className="flex flex-col gap-3 pb-6">
            {(groups ?? []).map((g) => (
              <Link
                key={g.id}
                to={`/ligues/${g.id}`}
                className="flex items-center gap-4 rounded-2xl border border-line bg-surface-2 px-4 py-4 transition-transform active:scale-[.98]"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-surface text-[24px]">
                  {g.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-bold text-ink">
                    {g.name}
                  </p>
                  <p className="mt-0.5 text-[12px] font-medium text-dim">
                    {g.members.length} membres
                    {g.gameIds && g.gameIds.length > 0 && (
                      <>
                        {" "}
                        · {g.gameIds.length} jeu
                        {g.gameIds.length > 1 ? "x" : ""}
                      </>
                    )}
                  </p>
                </div>
                <Icon name="chevron" size={18} className="shrink-0 text-dim" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </Page>
  );
};
