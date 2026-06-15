import { TeamLogo } from '../../components/ui/TeamLogo';
import { useMapImages, valoSlug } from '../../lib/valorant';
import type { Team, VetoStep } from '../../types/esports';

const LABELS: Record<VetoStep['type'], string> = {
  ban: 'Ban',
  pick: 'Pick',
  decider: 'Decider',
};

/* Classes statiques (Tailwind ne génère pas les noms construits par interpolation). */
const BAN_STYLE = { border: 'border-ban/40 bg-ban/5', fallback: 'bg-ban/15', badge: 'bg-ban' };
const PICK_STYLE = { border: 'border-pick/40 bg-pick/5', fallback: 'bg-pick/15', badge: 'bg-pick' };

/** Une carte du veto : vignette de map, couleur (vert pick / rouge ban), logo équipe. */
const VetoCard = ({ step, team }: { step: VetoStep; team: Team | null }) => {
  const { data: mapImages } = useMapImages();
  const img = mapImages?.[valoSlug(step.map)];
  const thumb = img?.icon ?? img?.splash;
  const style = step.type === 'ban' ? BAN_STYLE : PICK_STYLE;

  return (
    <div className={`relative w-[108px] shrink-0 overflow-hidden rounded-[14px] border ${style.border}`}>
      <div className="relative h-16 w-full">
        {thumb ? (
          <img
            src={thumb}
            alt={step.map}
            referrerPolicy="no-referrer"
            className="size-full object-cover"
          />
        ) : (
          <div className={`size-full ${style.fallback}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
        {/* Badge action (coloré) + logo de l'équipe qui agit. */}
        <div className={`absolute top-1.5 left-1.5 flex items-center gap-1 rounded-md px-1.5 py-0.5 ${style.badge}`}>
          {team && <TeamLogo tag={team.tag} size={13} logoUrl={team.logoUrl} />}
          <span className="text-[9px] font-extrabold tracking-wide text-white uppercase">
            {LABELS[step.type]}
          </span>
        </div>
        <span className="absolute bottom-1.5 left-2 text-[13px] font-bold tracking-tight text-white drop-shadow">
          {step.map}
        </span>
      </div>
    </div>
  );
};

/** Veto des cartes : suite ordonnée des bans / picks / decider. */
export const MatchVeto = ({
  veto,
  teamA,
  teamB,
}: {
  veto: VetoStep[];
  teamA: Team;
  teamB: Team;
}) => (
  <section className="px-5 pt-5">
    <h2 className="mb-2 text-[13px] font-bold tracking-wide text-dim uppercase">Veto des cartes</h2>
    <div className="flex flex-wrap gap-2">
      {veto.map((step) => (
        <VetoCard
          key={step.order}
          step={step}
          team={step.team === 'a' ? teamA : step.team === 'b' ? teamB : null}
        />
      ))}
    </div>
  </section>
);
