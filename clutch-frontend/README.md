# Clutch Frontend — PWA

PWA **React 19 + TypeScript** mobile-first : calendrier unifié des matchs de
l'Esports World Cup, filtrable par jeu et par équipe, avec **pronostics
communautaires**, groupes et classements. Aussi packagée en app mobile via
**Capacitor**.

> Voir aussi : [CLAUDE.md](CLAUDE.md) (guide de contribution & conventions) ·
> [.claude/rules/](.claude/rules) (architecture, composants, theming) ·
> [../DEPLOYMENT.md](../DEPLOYMENT.md) (prod & CI/CD).

---

## Stack

- **React 19** + **TypeScript** (strict, composants fonctionnels en arrow)
- **Vite** (build + dev server avec proxy `/api`)
- **Tailwind CSS v4** — pas de `tailwind.config.js` ; thème dans
  `src/index.css` via `@theme { ... }` (accent orange `#e2260a`)
- **TanStack Query** — données serveur (jamais de `fetch` éparpillé)
- **React Router** — routing, filtres dans l'URL (query params)
- **vite-plugin-pwa** — service worker + manifest (offline, installable)
- **Supabase JS** — authentification (JWT envoyé en `Bearer` à l'API)
- **Capacitor** — build mobile Android / iOS

---

## Démarrage

```bash
cp .env.example .env     # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev              # http://localhost:5173
```

En dev, **aucun `VITE_API_URL`** : le front appelle `/api`, proxifié par Vite
vers le backend sur `http://127.0.0.1:8000` (voir [vite.config.ts](vite.config.ts)).
Lancer le backend en parallèle (voir [../clutch-backend/README.md](../clutch-backend/README.md)).

---

## Commandes

| Action                                 | Commande                                          |
| -------------------------------------- | ------------------------------------------------- |
| Dev                                    | `npm run dev`                                     |
| Build prod                             | `npm run build`                                   |
| Aperçu du build                        | `npm run preview`                                 |
| Lint                                   | `npm run lint`                                    |
| Tests                                  | `npm run test` (Vitest) · `npm run test:coverage` |
| Régénérer les types API depuis OpenAPI | `npm run gen:api`                                 |
| Mobile : sync                          | `npm run mobile:sync`                             |
| Mobile : ouvrir Android Studio         | `npm run mobile:android`                          |
| Mobile : ouvrir Xcode                  | `npm run mobile:ios`                              |

> `gen:api` lit la spec OpenAPI du backend (`http://localhost:8000/openapi.json`)
> et génère `src/api/generated/schema.ts`. **Ne pas écrire les types des réponses
> API à la main** — le backend est la source de vérité.

---

## Configuration (`.env`)

| Variable                 | Rôle                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | URL du projet Supabase (auth)                                     |
| `VITE_SUPABASE_ANON_KEY` | clé publique anon Supabase                                        |
| `VITE_API_URL`           | URL de l'API (prod / mobile). **Absent en dev** → `/api` proxifié |

---

## Structure (`src/`)

```
src/
├── main.tsx          # point d'entrée, providers (Router, QueryClient)
├── index.css         # Tailwind v4 + @theme (tokens couleur)
├── routes/           # une vue = une route (Calendar, Match, Team, Groups, Profil…)
├── features/         # logique métier par domaine
│   ├── calendar/     #   regroupement par jour, countdown
│   ├── matches/      #   cartes & hero de match, maps, veto, streams
│   ├── filters/      #   filtres jeu/équipe (query params)
│   ├── prono/        #   pronostics, groupes, classements, scoring
│   ├── search/  games/  teams/  favorites/  onboarding/  settings/  auth/
├── components/
│   ├── ui/           # primitives PURES (Button, Card, Sheet, Avatar, Flag, *Icon…)
│   └── layout/       # Header, BottomNav, Sidebar, Page
├── api/
│   ├── generated/    # types/client générés depuis OpenAPI (NE PAS éditer)
│   ├── client.ts     # client HTTP (base URL, Bearer Supabase)
│   ├── queries/      # hooks TanStack Query (useMatches, useGroups…)
│   └── mocks/        # fixtures MSW (forme attendue de l'API)
├── lib/              # utilitaires purs (dates, drapeaux, assets par jeu)
└── types/            # types manuels (esports.ts, community.ts)
```

**Règles de dépendances** : `routes/` assemble `features/` + `components/` (pas
de fetch direct) ; `components/ui/` est **pur** (aucun import de `features/` ou
`api/`) ; les données passent **toujours** par `api/queries/`.

---

## Conventions

- **Langue** : commentaires en français, termes techniques en anglais.
- **Couleurs** : uniquement via les tokens `@theme` — jamais de couleur en dur.
  Thème sombre via `data-theme="dark"`, aucune classe `dark:` à écrire.
- **État** : hooks natifs pour l'UI locale ; **TanStack Query** pour les données
  serveur.
- **Données** : jamais d'appel à Liquipedia depuis le front — uniquement notre
  API interne.
- **Statuts de match** : `upcoming` / `live` / `done` (jamais `finished`).
- **Accessibilité** : mobile-first, cibles tactiles confortables, contraste
  suffisant, animations désactivées si `prefers-reduced-motion`.

Détails : [.claude/rules/architecture.md](.claude/rules/architecture.md) ·
[components.md](.claude/rules/components.md) ·
[theming.md](.claude/rules/theming.md).

---

## App mobile (Capacitor)

Le build web est embarqué dans une coque native. Définir `VITE_API_URL` (l'app
mobile n'a pas de proxy Vite) puis :

```bash
npm run mobile:sync       # build + npx cap sync
npm run mobile:android    # ouvre Android Studio
```
