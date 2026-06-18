import type { GamePlugin } from './index';

// "Mannfield (Night)" → "mannfield", "DFH Stadium (Stormy)" → "dfhstadium"
const rlMapSlug = (name: string) =>
  name
    .replace(/\s*\([^)]*\)/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const rlMapImage = (mapName: string) => ({
  splash: `/maps/rl/${rlMapSlug(mapName)}.jpg`,
});

export const rlPlugin: GamePlugin = {
  unitLabel: 'partie',
  useMapImage: rlMapImage,
};
