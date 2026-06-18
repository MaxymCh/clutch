import { BRStandingsTable } from './shared/BRStandingsTable';
import type { GamePlugin } from './index';

export const apexPlugin: GamePlugin = {
  unitLabel: 'partie',
  MapDetail({ map }) {
    return <BRStandingsTable standings={map.standings ?? []} title={map.name} />;
  },
  OverallDetail({ standings }) {
    return <BRStandingsTable standings={standings} title="Classement général" />;
  },
};
