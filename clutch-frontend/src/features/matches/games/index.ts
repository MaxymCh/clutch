import type { GameId, MapPlayer, MapScore, Team } from '../../../types/esports';
import { cs2Plugin } from './cs2';
import { dotaPlugin } from './dota';
import { lolPlugin } from './lol';
import { r6Plugin } from './r6';
import { valPlugin } from './val';

export interface MapDetailProps {
  map: MapScore;
  teamA: Team;
  teamB: Team;
}

export interface PlayerIconProps {
  player: MapPlayer;
  size?: number;
}

/**
 * Plugin d'un jeu : toutes les propriétés sont optionnelles.
 * Un jeu sans plugin (ou avec un plugin partiel) dégrade proprement.
 *
 * Ajouter un nouveau jeu = créer un fichier games/<id>.tsx,
 * exporter un plugin, et l'enregistrer dans GAME_PLUGINS ci-dessous.
 */
export interface GamePlugin {
  unitLabel?: 'carte' | 'partie';
  /** Hook React : retourne l'image splash/icon d'une carte nommée. */
  useMapImage?: (mapName: string) => { splash?: string; icon?: string } | undefined;
  /** Hook React : retourne l'image veto d'une carte nommée. */
  useVetoImage?: (mapName: string) => { splash?: string; icon?: string } | undefined;
  /** Composant de détail game-specific (draft, mi-temps, bans…). */
  MapDetail?: React.FC<MapDetailProps>;
  /** Icône du personnage joué dans le scoreboard (agent, champion, héros…). */
  PlayerIcon?: React.FC<PlayerIconProps>;
}

export const GAME_PLUGINS: Partial<Record<GameId, GamePlugin>> = {
  val: valPlugin,
  cs2: cs2Plugin,
  dota: dotaPlugin,
  lol: lolPlugin,
  r6: r6Plugin,
};

export const getPlugin = (gameId: GameId): GamePlugin | undefined => GAME_PLUGINS[gameId];
