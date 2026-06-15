import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGames } from "../../api/queries/useGames";
import { useCreateGroup, useJoinGroup } from "../../api/queries/useGroups";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";

const EMOJIS = ["🔥", "🏆", "⚡", "🎮", "💥", "🦅", "👑", "🚀"];

const Label = ({ children }: { children: string }) => (
  <label className="text-xs font-bold tracking-wide text-dim uppercase">
    {children}
  </label>
);

const inputClass =
  "mt-2 w-full rounded-[13px] border-[1.5px] border-line-2 bg-surface px-4 py-3 text-[15px] font-semibold text-ink outline-none placeholder:text-faint focus:border-accent";

/** Formulaire de création de groupe (nom + emblème + jeux). */
export const CreateGroupForm = () => {
  const navigate = useNavigate();
  const { mutate: create, isPending } = useCreateGroup();
  const { data: games } = useGames();
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🔥");
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);

  const allGames = selectedGameIds.length === 0;

  const toggleGame = (id: string) => {
    setSelectedGameIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const scopeLabel = allGames
    ? "Tous les jeux"
    : (games ?? [])
        .filter((g) => selectedGameIds.includes(g.id))
        .map((g) => g.short)
        .join(", ");

  const submit = () =>
    create(
      {
        name,
        emoji,
        gameIds: allGames ? undefined : selectedGameIds,
      },
      { onSuccess: (g) => navigate(`/ligues/${g.id}`, { replace: true }) },
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
                emoji === e
                  ? "border-accent bg-accent/8"
                  : "border-line-2 bg-surface"
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label>Jeux du groupe</Label>
        <p className="mt-1 text-[12px] font-medium text-dim">
          Sélectionne les jeux pour ce groupe, ou laisse vide pour tous.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {(games ?? []).map((g) => {
            const active = selectedGameIds.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleGame(g.id)}
                className={`relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all active:scale-95 ${
                  active ? "border-accent" : "border-line"
                }`}
              >
                {g.bgUrl ? (
                  <img
                    src={g.bgUrl}
                    alt={g.name}
                    className={`h-16 w-full object-cover ${active ? "brightness-75" : "brightness-50"}`}
                  />
                ) : (
                  <div className="flex h-16 w-full items-center justify-center bg-ink/10">
                    <span className="text-xs font-bold text-ink">{g.tag}</span>
                  </div>
                )}
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-bold text-white drop-shadow-sm">
                  {g.short}
                </span>
                {active && (
                  <span className="absolute top-1.5 right-1.5 grid size-5 place-items-center rounded-full bg-accent">
                    <Icon
                      name="check"
                      size={12}
                      strokeWidth={2.5}
                      className="text-white"
                    />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3.5">
        <span className="text-3xl leading-none">{emoji}</span>
        <div>
          <div className="text-base font-bold text-ink">
            {name.trim() || "Mon groupe"}
          </div>
          <div className="mt-1 text-xs font-semibold text-dim">
            {scopeLabel} · tu seras le 1ᵉʳ membre
          </div>
        </div>
      </div>
      <Button
        full
        size="lg"
        onClick={submit}
        disabled={isPending || !name.trim()}
      >
        <Icon name="plus" size={17} strokeWidth={2.2} />
        {isPending ? "Création…" : "Créer le groupe"}
      </Button>
    </div>
  );
};

/** Formulaire pour rejoindre un groupe via code d'invitation. */
export const JoinGroupForm = () => {
  const navigate = useNavigate();
  const { mutate: join, isPending } = useJoinGroup();
  const [code, setCode] = useState("");

  const submit = () =>
    join(code, {
      onSuccess: (g) => navigate(`/ligues/${g.id}`, { replace: true }),
    });

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
      <Button
        full
        size="lg"
        onClick={submit}
        disabled={isPending || code.trim() === ""}
      >
        <Icon name="users" size={17} strokeWidth={2.1} />
        {isPending ? "Connexion…" : "Rejoindre le groupe"}
      </Button>
    </div>
  );
};
