import { AgentIcon } from '../../../components/ui/AgentIcon';
import { useMapImages, valoSlug } from '../../../lib/valorant';
import type { GamePlugin } from './index';

export const valPlugin: GamePlugin = {
  unitLabel: 'carte',

  useMapImage(mapName) {
    const { data } = useMapImages();
    return data?.[valoSlug(mapName)];
  },

  useVetoImage(mapName) {
    const { data } = useMapImages();
    return data?.[valoSlug(mapName)];
  },

  PlayerIcon({ player, size = 22 }) {
    if (!player.agent) return null;
    return <AgentIcon agent={player.agent} size={size} />;
  },
};
