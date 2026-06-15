# Clutch Frontend — Architecture

## Principe de découpage

La maquette Claude Design (un seul fichier HTML) est une RÉFÉRENCE VISUELLE,
pas du code à importer. On la redécoupe en composants React. Règle : un fichier
= une responsabilité. Si un composant dépasse ~150 lignes, le découper.

## Arborescence `src/`

src/
├── main.tsx # point d'entrée, providers (Router, QueryClient)
├── index.css # Tailwind v4 + @theme (tokens couleur, dont l'orange)
├── routes/ # une vue = une route
│ ├── CalendarPage.tsx # vue calendrier (page d'accueil)
│ ├── TeamPage.tsx # page d'une équipe
│ └── MatchPage.tsx # détail d'un match
├── features/ # logique métier par domaine
│ ├── calendar/ # regroupement par jour, tri, logique de la vue
│ ├── filters/ # filtres par jeu et par équipe
│ ├── matches/ # liste/carte de match
│ └── teams/ # infos équipe
├── components/ # UI réutilisable, SANS logique métier
│ ├── ui/ # primitives (Button, Badge, Card, Spinner…)
│ └── layout/ # Header, BottomNav, conteneurs de page
├── api/
│ ├── generated/ # types + client générés depuis OpenAPI (NE PAS éditer)
│ ├── client.ts # config du client (base URL, en-têtes)
│ └── queries/ # hooks TanStack Query (useMatches, useTeam…)
├── lib/ # utilitaires purs (formatage dates, helpers)
└── types/ # types manuels NON couverts par l'API générée

## Règles de dépendances (qui importe quoi)

- `routes/` assemble des `features/` et des `components/`. Pas de fetch direct.
- `features/` peut utiliser `api/queries/`, `components/`, `lib/`.
- `components/ui/` est PUR : aucun import depuis `features/` ou `api/`.
  (Sinon tu crées des dépendances circulaires et l'UI n'est plus réutilisable.)
- Les appels données passent TOUJOURS par `api/queries/` (TanStack Query).
  Jamais de `fetch` éparpillé dans les composants.

## Routing

- React Router. Routes : `/` (calendrier), `/team/:id`, `/match/:id`.
- Les filtres (jeu, équipe) vivent dans l'URL (query params) pour être
  partageables et survivre au refresh — pas seulement dans un state local.

## Données

- Le front ne connaît QUE notre API interne. Jamais d'appel à Liquipedia ici.
- Types des réponses API : importés depuis `api/generated/`, jamais réécrits.

## Thème (rappel, détail dans theming.md)

- Couleurs définies une fois dans `index.css` via `@theme`. Accent : `#e2260a`.
- Les composants utilisent les tokens du thème, pas de couleur en dur.
