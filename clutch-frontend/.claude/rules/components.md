# Patterns de composants UI

## Règle générale

- `src/components/ui/` — primitives pures, sans logique métier ni import depuis `features/` ou `api/`
- `src/features/` — logique métier par domaine (calendar, matches, prono, filters…)
- `src/routes/` — assemble des features et des composants, pas de fetch direct

## Primitives (`src/components/ui/`)

| Composant | Usage |
|---|---|
| `Button` | Bouton principal — variantes `primary` (accent), `ghost`, `destructive` |
| `Badge` | Étiquette courte (statut, tag équipe) |
| `Card` | Conteneur avec `shadow-card`, `bg-surface` |
| `Sheet` | Panneau glissant depuis le bas (actions, settings, prono) |
| `ConfirmModal` | Modale de confirmation pour actions destructives |
| `EmptyState` | Placeholder quand une liste est vide |
| `Spinner` | Indicateur de chargement |
| `Toggle` | Interrupteur on/off |
| `Seg` | Sélecteur segmenté (tabs compacts) |
| `Avatar` | Initiales de l'utilisateur avec couleur dérivée du tag |
| `Flag` | Drapeau pays via `/flags/{countryCode}.svg` (servi localement) |

## Icônes & logos (`src/components/ui/`)

| Composant | Source |
|---|---|
| `GameLogo` | Logo du jeu par `gameId` |
| `GameBrand` | Nom + logo combinés |
| `GameTile` | Tuile cliquable (filtre jeux) |
| `TeamLogo` | Logo équipe |
| `AgentIcon` | Icône agent Valorant |
| `ChampionIcon` | Icône champion LoL |
| `HeroIcon` | Icône héros générique |
| `HoKHeroIcon` | Icône héros HoK (via `/assets/hok/heroes`) |
| `MLHeroIcon` | Icône héros MLBB (via `/assets/mlbb/heroes`) |
| `OperatorIcon` | Icône opérateur CS2/R6 |

## Cartes de match (`src/features/matches/`)

### `MatchCard`
Carte résumée pour les listes. Affiche : équipes, score, statut, heure, jeu.
- Statut `live` → badge orange + `animate-live-ping`
- Statut `done` → score final grisé
- Statut `upcoming` → heure en `text-ink-2`

### `MatchHero`
En-tête de la page détail d'un match (`MatchPage`). Affiche le grand format avec maps, viewers, phase.

### `MatchesByDay`
Regroupe les `MatchCard` par date avec un `DayTabs` de navigation.

## Filtres (`src/features/filters/`)

### `FilterBar`
Barre de filtres combinant `GameFilter` et `TeamFilter`.

### `GameFilter`
Rangée de `GameTile` cliquables. Filtre via query param `?game=`.

### `TeamFilter`
Liste déroulante d'équipes. Filtre via query param `?team=`.

### `useMatchFilters`
Hook qui lit/écrit les query params et retourne les matchs filtrés.

## Pronostics (`src/features/prono/`)

- `PredictionsContext` — contexte global des pronos (état local ou serveur)
- `PredictCard` — carte de prono sur un match `upcoming`
- `PredictSheet` — Sheet de saisie du pick + score exact
- Barème : 25 pts (score exact) / 10 pts (bon vainqueur) / 0

## Statuts de match — règle d'affichage

| Statut | Couleur token | Badge | Score |
|---|---|---|---|
| `upcoming` | `text-upcoming` | — | heure |
| `live` | `text-live` / `bg-live` | LIVE + ping | score en cours |
| `done` | `text-done` | — | score final |

⚠️ Jamais `finished` — toujours `done`.

## Layout (`src/components/layout/`)

| Composant | Usage |
|---|---|
| `BottomNav` | Navigation principale (mobile) |
| `Sidebar` | Navigation latérale (desktop) |
| `Header` / `TopBar` | En-tête de page |
| `Page` | Conteneur de page avec padding standard |
