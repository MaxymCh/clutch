import { owSlug, useOWMaps } from '../../../lib/overfast';
import { OWBans } from './shared/OWBans';
import type { GamePlugin } from './index';

export const owPlugin: GamePlugin = {
  unitLabel: 'carte',
  useMapImage(mapName) {
    const { data } = useOWMaps();
    const slug = owSlug(mapName);
    return { splash: data?.[slug] ?? `/maps/ow/${slug}.jpg` };
  },
  useVetoImage(mapName) {
    const { data } = useOWMaps();
    const slug = owSlug(mapName);
    return { splash: data?.[slug] ?? `/maps/ow/${slug}.jpg` };
  },
  MapDetail({ map, teamA, teamB }) {
    return (
      <OWBans
        bansA={map.bansA}
        bansB={map.bansB}
        teamA={teamA}
        teamB={teamB}
        mode={map.mode}
      />
    );
  },
};
