import { HalfBreakdown } from './shared/HalfBreakdown';
import type { GamePlugin } from './index';

const cs2MapSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

export const cs2Plugin: GamePlugin = {
  unitLabel: 'carte',

  useMapImage(mapName) {
    const slug = cs2MapSlug(mapName);
    return { splash: `/maps/cs2/${slug}.png` };
  },

  useVetoImage(mapName) {
    const slug = cs2MapSlug(mapName);
    return { splash: `/maps/cs2/${slug}.png`, icon: `/maps/cs2/${slug}.png` };
  },

  MapDetail({ map, teamA, teamB }) {
    return (
      <HalfBreakdown
        halvesA={map.halvesA}
        halvesB={map.halvesB}
        teamA={teamA}
        teamB={teamB}
        vod={map.vod}
      />
    );
  },
};
