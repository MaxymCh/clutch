import { ChampionIcon } from '../../../components/ui/ChampionIcon';
import type { GamePlugin } from './index';

export const lolPlugin: GamePlugin = {
  unitLabel: 'partie',

  useMapImage: () => ({ splash: '/maps/lol/summonersrift.jpg' }),

  PlayerIcon({ player, size = 22 }) {
    if (!player.champion) return null;
    return <ChampionIcon champion={player.champion} size={size} />;
  },
};
