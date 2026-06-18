import { HeroIcon } from '../../../components/ui/HeroIcon';
import { DotaDraft } from './shared/DotaDraft';
import type { GamePlugin } from './index';

export const dotaPlugin: GamePlugin = {
  unitLabel: 'partie',

  MapDetail({ map, teamA, teamB }) {
    return (
      <DotaDraft
        heroesA={map.heroesA}
        heroesB={map.heroesB}
        bansA={map.bansA}
        bansB={map.bansB}
        sideA={map.sideA}
        sideB={map.sideB}
        length={map.length}
        teamA={teamA}
        teamB={teamB}
      />
    );
  },

  PlayerIcon({ player, size = 22 }) {
    if (!player.hero) return null;
    return <HeroIcon hero={player.hero} size={size} />;
  },
};
