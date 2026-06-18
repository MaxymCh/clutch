# Contrat API Clutch — extrait du frontend (source de vérité)

> Généré par lecture directe du code du frontend (`c:\etna\clutch-frontend`).
> Fichiers de référence : `src/types/esports.ts`, `src/types/community.ts`,
> `src/api/mocks/*` (fixtures = forme concrète attendue), `src/api/queries/*`
> (hooks), `src/features/filters/useMatchFilters.ts`,
> `src/features/search/SearchView.tsx` (query params),
> `src/features/prono/*` (pronostics & scoring).
>
> **Règle absolue : le JSON renvoyé par l'API reproduit ces formes à
> l'identique — mêmes noms de champs (camelCase), mêmes types, mêmes valeurs
> d'énumération.** Schémas Pydantic v2 avec alias camelCase.

## 1. Énumérations (valeurs EXACTES)

| Enum | Valeurs | Remarque |
|---|---|---|
| `GameId` | `"val"`, `"lol"`, `"cs2"`, `"dota"`, `"rl"`, `"ow"`, `"apex"`, `"r6"`, `"pubg"`, `"fn"`, `"ff"`, `"mlbb"`, `"hok"`, `"sf6"`, `"tk8"`, `"bo7"`, `"tft"` | identifiants fermés, minuscules |
| `MatchStatus` | `"upcoming"`, `"live"`, `"done"` | ⚠️ c'est `done`, PAS `finished` |
| `BestOf` | `"BO1"`, `"BO3"`, `"BO5"` | chaîne, pas un entier |
| `MapScore.winner` / `Prediction.pick` | `"a"`, `"b"` | côté A ou B du match |

## 2. Entités INGÉRÉES (miroir Liquipedia, lecture seule, écrites par le worker)

### Game

| Champ JSON | Type | Obligatoire | Exemple |
|---|---|---|---|
| `id` | `GameId` | oui | `"val"` |
| `name` | `string` | oui | `"League of Legends"` |
| `short` | `string` | oui | `"LoL"` |
| `tag` | `string` | oui | `"LOL"` |

Ordre `/games` : `val, lol, cs2, dota, rl, ow, apex, r6, pubg, fn, ff, mlbb, hok, sf6, tk8, bo7, tft` (cf. `GAME_ORDER`).

### Team

| Champ JSON | Type | Obligatoire | Exemple |
|---|---|---|---|
| `id` | `string` | oui | `"flcn"` |
| `name` | `string` | oui | `"Team Falcons"` |
| `tag` | `string` | oui | `"FLCN"` |
| `countryCode` | `string` | oui | `"SA"` (ISO alpha-2 ; le front utilise aussi `"EU"`) |

Ordre `/teams` : tri alphabétique sur `name`.

### MapScore (imbriqué dans Match)

| Champ JSON | Type | Obligatoire |
|---|---|---|
| `name` | `string` | oui |
| `scoreA` / `scoreB` | `int` | oui |
| `winner` | `"a" \| "b"` | non (absent si carte en cours) |
| `live` | `bool` | non (`true` sur la carte en cours uniquement) |

### Match

| Champ JSON | Type | Obligatoire | Règle |
|---|---|---|---|
| `id` | `string` | oui | |
| `gameId` | `GameId` | oui | |
| `teamA` / `teamB` | `Team` (objet embarqué) | oui | jamais un simple id |
| `status` | `MatchStatus` | oui | |
| `phase` | `string` | oui | libellé FR libre (`"Quart de finale"`, `"Grande Finale"`…) |
| `bestOf` | `BestOf` | oui | |
| `date` | `string` | oui | `"YYYY-MM-DD"` — dérivée du timestamp UTC stocké en base, **sérialisée en `DISPLAY_TZ`** |
| `time` | `string` | oui | `"HH:mm"` — idem |
| `scoreA` / `scoreB` | `int` | non | présents si live/done |
| `maps` | `MapScore[]` | non | |
| `currentMapLabel` | `string` | non | live, best effort LPDB, sinon omis |
| `viewers` | `string` | non | live, format `"74K"`, best effort LPDB, sinon omis |
| `oddsA` | `int` | **omis** | décision : pas de source → jamais renvoyé (le front fait `?? 50`) |

⚠️ Stockage : timestamp UTC unique en base ; `date`/`time` sont sérialisées
dans le fuseau d'affichage configurable `DISPLAY_TZ` (`.env`, défaut
`Europe/Paris`) car le front affiche ces chaînes telles quelles. UTC en
interne, Paris à la sortie, front inchangé. (Décision actée.)

⚠️ Pas d'entité ni d'endpoint Tournament : la phase vit dans `Match.phase`.

## 3. Entités APPLICATIVES (possédées par l'app, JAMAIS touchées par le worker)

### User (`GET /me`)

| Champ JSON | Type | Obligatoire | Règle |
|---|---|---|---|
| `id` | `string` | oui | |
| `name` | `string` | oui | pseudo |
| `tag` | `string` | oui | 2–3 lettres majuscules (avatar) |
| `countryCode` | `string` | oui | ISO alpha-2 |
| `points` | `int` | oui | total des points de prono |
| `globalRank` | `int` | oui | calculé (position par points, desc) |
| `streak` | `int` | oui | pronostics gagnants d'affilée |

### GroupMember (imbriqué dans Group)

| Champ JSON | Type | Obligatoire | Règle |
|---|---|---|---|
| `name` | `string` | oui | |
| `tag` | `string` | oui | |
| `points` | `int` | oui | |
| `isMe` | `bool` | non | calculé par rapport à l'utilisateur COURANT (requête) |

### Group

| Champ JSON | Type | Obligatoire | Règle |
|---|---|---|---|
| `id` | `string` | oui | |
| `name` | `string` | oui | |
| `emoji` | `string` | oui | |
| `code` | `string` | oui | code d'invitation unique, format type `CLTCH-XXXX` |
| `members` | `GroupMember[]` | oui | triés par `points` desc (cf. fixtures) |

### LeaderboardEntry (`GET /leaderboard`)

| Champ JSON | Type | Obligatoire |
|---|---|---|
| `rank` | `int` | oui |
| `name` | `string` | oui |
| `tag` | `string` | oui |
| `points` | `int` | oui |
| `countryCode` | `string` | non |

### Prediction (constaté dans le front, stocké localStorage aujourd'hui)

`{ pick: "a" | "b", scoreA: int, scoreB: int }`, indexé par `matchId`
(`PredictionMap = Record<matchId, Prediction>`). Le commentaire du
`PredictionsProvider` annonce un futur `POST /predictions`.

## 4. Endpoints ↔ hooks du front

| Endpoint | Hook / usage front | Réponse | Params / body |
|---|---|---|---|
| `GET /matches` | `useMatches()` | `Match[]` | query optionnels : `game`, `team`, `day`, `status`, `q` |
| `GET /matches/{id}` | `useMatch(id)` | `Match` | 404 si introuvable |
| `GET /teams` | `useTeams()` | `Team[]` | — |
| `GET /teams/{id}` | `useTeam(id)` | `Team` | 404 si introuvable |
| `GET /games` | `useGames()` | `Game[]` | — |
| `GET /me` | `useUser()` | `User` | — |
| `GET /groups` | `useGroups()` | `Group[]` | groupes de l'utilisateur courant |
| `GET /groups/{id}` | `useGroup(id)` | `Group` | 404 si introuvable |
| `POST /groups` | `useCreateGroup()` | `Group` | body `{ name: string, emoji: string }` |
| `POST /groups/join` | `useJoinGroup()` | `Group` | body `{ code: string }` |
| `GET /leaderboard` | `useLeaderboard()` | `LeaderboardEntry[]` | query `limit` optionnel (défaut 50), tri points desc |
| `GET /predictions` | futur branchement provider | `PredictionMap` | — |
| `POST /predictions` | annoncé par le provider | `Prediction` | body `{ matchId, pick, scoreA, scoreB }` ; refusé si match non `upcoming` ou déjà commencé |

Notes :
- Les hooks appellent les endpoints **sans paramètres** ; le filtrage est fait
  côté client (`?game=&team=&day=` via `useMatchFilters`, `?q=&status=&game=`
  via la recherche). Les endpoints acceptent ces filtres sans changer la forme.
- Base URL front : `VITE_API_URL` sinon `/api`. `useMatches` refetch / 60 s
  → lectures en base uniquement, jamais Liquipedia en direct.
- Erreurs : `HTTPException` FastAPI (404 etc.), jamais de dict brut.
- Attribution CC-BY-SA Liquipedia dans les métadonnées de l'API (description
  OpenAPI / champ meta), sans toucher aux formes ci-dessus.

## 5. Pronostics & scoring (constats front — logique à valider)

- Prono possible **uniquement** si `status === "upcoming"` ; modifiable tant
  que le match n'a pas commencé (`MatchHero.tsx:96`, `PredictCard`).
- Soumission = vainqueur **ET** score exact obligatoires (bouton désactivé
  sinon, `PredictSheet`).
- Scores exacts proposés selon le format : BO5 → 3-0 / 3-1 / 3-2 ;
  BO3 → 2-0 / 2-1 ; BO1 → 1-0.
- Barème VALIDÉ — paliers EXCLUSIFS : **25 pts si score exact, sinon 10 pts
  si bon vainqueur, sinon 0**. Pas de cumul.
- `streak` = pronostics gagnants consécutifs (bon vainqueur).
- `points` (User, GroupMember) = somme des points gagnés ; `globalRank` et
  `rank` recalculés par tri desc des points.
- Le scoring s'exécute côté APP (pas le worker d'ingestion) quand un match
  passe à `done` — mécanisme proposé : tâche planifiée dans le processus API.

## 6. Architecture des données (décision actée)

- **Ingéré** (`games`, `teams`, `matches`) : modèles dans
  `app/models/catalog.py`, lecture seule pour l'API, écrits uniquement par le
  worker. Le worker n'importe QUE ce module.
- **Applicatif** (`users`, `groups`, `predictions`, leaderboard) :
  `app/models/community.py`, lecture-écriture par l'API, jamais touché par le
  worker.
- Jeux supportés (17) : `val`, `lol`, `cs2`, `dota`, `rl`, `ow`, `apex`, `r6`, `pubg`, `fn`, `ff`, `mlbb`, `hok`, `sf6`, `tk8`, `bo7`, `tft` — pagenames des tournois configurables par `.env` (`EWC_TOURNAMENTS`, ajout/retrait sans toucher au code).

## 7. Authentification — VALIDÉE

Constat front : **aucune UI d'auth** (pas d'écran login/signup, pas de token
stocké, pas d'en-tête Authorization dans `client.ts`). `useUser` appelle `/me`
directement. L'onboarding est purement local (favoris + flag localStorage).

Stratégie actée : **session anonyme par cookie httpOnly signé** — au premier
appel `/me`, le backend crée l'utilisateur et pose le cookie ; toutes les
routes communauté identifient l'utilisateur via ce cookie. Pas d'email/mot de
passe, pas d'OAuth, pas de récupération de compte.

- `name` : pseudo aléatoire lisible type `clutcher_8421`.
- `tag` : dérivé du pseudo (2 lettres majuscules).
- `countryCode` : déduit de `Accept-Language` si possible, fallback `FR`.
- Cookie `SameSite=None; Secure` en prod (origines front/back différentes,
  cohérent avec la liste CORS explicite) ; note de branchement front :
  `credentials: 'include'`.

## 8. Décisions actées (session du 2026-06-10)

1. Pas de Tournament. 2. Communauté incluse, séparation ingéré/applicatif.
3. UTC en base, normalisation à l'ingestion ; sérialisation `date`/`time` en
   `DISPLAY_TZ` (défaut `Europe/Paris`). 4. `oddsA` omis, aucune valeur fabriquée.
5. `viewers`/`currentMapLabel` best effort, jamais inventés.
6. Auth cookie anonyme validée. 7. 17 jeux supportés configurables via `EWC_TOURNAMENTS` dans `.env`. 8. Scoring exclusif 25/10/0, tâche côté API,
   worker = catalog uniquement. 9. `/leaderboard?limit=` (défaut 50).
