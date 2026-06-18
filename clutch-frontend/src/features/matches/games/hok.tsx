import { HoKHeroIcon } from '../../../components/ui/HoKHeroIcon';
import { MLBBDraft } from './shared/MLBBDraft';
import type { GamePlugin } from './index';

export const hokPlugin: GamePlugin = {
  unitLabel: 'partie',

  MapDetail({ map, teamA, teamB }) {
    return (
      <MLBBDraft
        heroesA={map.heroesA}
        heroesB={map.heroesB}
        bansA={map.bansA}
        bansB={map.bansB}
        sideA={map.sideA}
        sideB={map.sideB}
        length={map.length}
        teamA={teamA}
        teamB={teamB}
        HeroIcon={HoKHeroIcon}
      />
    );
  },

  PlayerIcon({ player, size = 22 }) {
    if (!player.champion) return null;
    return <HoKHeroIcon hero={player.champion} size={size} />;
  },
};
