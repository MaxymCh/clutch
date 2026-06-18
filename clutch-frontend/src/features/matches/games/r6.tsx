import { HalfBreakdown } from './shared/HalfBreakdown';
import { R6OperatorBans } from './shared/R6OperatorBans';
import type { GamePlugin } from './index';

const r6MapSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

const r6MapImage = (mapName: string) => ({
  splash: `/maps/r6/${r6MapSlug(mapName)}.jpg`,
});

export const r6Plugin: GamePlugin = {
  unitLabel: 'carte',

  useMapImage: r6MapImage,
  useVetoImage: r6MapImage,

  MapDetail({ map, teamA, teamB }) {
    return (
      <>
        <HalfBreakdown
          halvesA={map.halvesA}
          halvesB={map.halvesB}
          teamA={teamA}
          teamB={teamB}
          vod={map.vod}
        />
        <R6OperatorBans
          opBansA={map.opBansA}
          opBansB={map.opBansB}
          teamA={teamA}
          teamB={teamB}
        />
      </>
    );
  },
};
