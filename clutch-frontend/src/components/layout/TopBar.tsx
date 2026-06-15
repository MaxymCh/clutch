import { useNavigate } from "react-router-dom";
import { Icon } from "../ui/Icon";

/** Barre de navigation des pages de détail : retour + titre. */
export const TopBar = ({ title }: { title: string }) => {
  const navigate = useNavigate();
  return (
    <>
      <div className="sticky top-0 z-10">
        {/* Zone de blur visible au-dessus de la barre */}
        <div className="h-6 backdrop-blur-xl" />
        {/* Barre opaque */}
        <div className="flex h-14 items-center gap-3 border-b border-line bg-surface px-4">
          <button
            onClick={() => navigate(-1)}
            aria-label="Retour"
            className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-[11px] bg-surface-2 text-ink transition-transform active:scale-95"
          >
            <Icon name="back" size={19} />
          </button>
          <span className="truncate text-base font-bold tracking-tight text-ink">
            {title}
          </span>
        </div>
      </div>
      {/* Séparation + espace entre top bar et contenu */}
      <div className="h-px bg-line" />
      <div className="h-6" />
    </>
  );
};
