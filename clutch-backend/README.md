# Clutch Backend — API & ingestion

API REST **FastAPI** qui alimente le frontend Clutch (calendrier EWC +
communauté), accompagnée d'un **worker** d'ingestion Liquipedia.

> Voir aussi : [CONTRAT-API.md](docs/CONTRAT-API.md) (contrat de données, source
> de vérité) · [CLAUDE.md](CLAUDE.md) (guide de contribution) ·
> [../DEPLOYMENT.md](../DEPLOYMENT.md) (prod & CI/CD).

---

## Règle d'or

Le **frontend fait foi**. Les schémas de sortie reproduisent à l'identique les
types TS du front (mêmes noms de champs JSON en **camelCase**, mêmes types,
mêmes valeurs d'enum). En cas de divergence : **s'arrêter et demander**, jamais
inventer le contrat.

Deux natures de données strictement séparées :

- **Catalog** (`games`, `teams`, `matches`) — miroir **lecture seule** de
  Liquipedia, écrit **uniquement** par `ingestion/worker.py`.
- **Community** (`users`, `groups`, `predictions`, leaderboard) — applicatif,
  lecture-écriture par l'API, **jamais** touché par le worker.

---

## Stack

- **FastAPI** (Python 3.12), async/await
- **Pydantic v2** (validation, schémas = contrat API)
- **SQLAlchemy 2.0** + **PostgreSQL**, migrations **Alembic**
- **APScheduler** — worker d'ingestion + tâche de scoring (dans le process API)
- **liquipydia** (client LPDB v3, version épinglée) — seul accès à Liquipedia
- **Supabase** (JWT) pour l'authentification

---

## Structure

```
app/
├── main.py            # app FastAPI, CORS, scheduler de scoring, attribution
├── api/               # routers
│   ├── catalog.py     #   /games /teams /matches (lecture seule)
│   ├── community.py   #   /me /groups /leaderboard /predictions
│   ├── auth.py        #   /auth/token (token Supabase pour tester via Swagger)
│   ├── assets.py      #   proxy d'assets tiers (contournement CORS)
│   ├── webhook.py     #   re-ingestion ciblée sur ping Liquipedia
│   └── deps.py        #   dépendances (session DB, utilisateur courant)
├── schemas/           # Pydantic = COPIE FIDÈLE des types du front (camelCase)
├── models/            # ORM SQLAlchemy
│   ├── catalog.py     #   données ingérées
│   └── community.py   #   données applicatives
├── services/          # logique métier (catalog, community, scoring, *_assets)
└── core/              # config (.env), session DB, sécurité JWT
ingestion/
├── liquipedia.py      # wrapper liquipydia (clé, User-Agent, rate limit, cache)
├── normalize.py       # mapping Liquipedia → forme du front
├── worker.py          # job planifié (importe SEULEMENT catalog)
└── seed_*.py          # seed de démo / matchs futurs (pronostics)
alembic/  ·  tests/  ·  docker-compose.yml  ·  pyproject.toml  ·  .env.example
```

---

## Démarrage

### Avec Docker (recommandé)

```bash
cp .env.example .env        # remplir les secrets
docker compose up           # api + worker + db
```

> DB de dev exposée sur le port **5433** (5432 est souvent pris par un Postgres
> Windows). En conteneur, le host de la DB est `db`.

### En local (venv)

```bash
python -m venv venv
venv\Scripts\activate          # Windows
pip install -e ".[dev]"

alembic upgrade head           # migrations
uvicorn app.main:app --reload  # API → http://localhost:8000/docs
python -m ingestion.worker     # worker d'ingestion (séparé)
```

> ⚠️ **Windows** : `uvicorn` async + psycopg plante sur le ProactorEventLoop par
> défaut. Préférer **Docker**, ou forcer un SelectorEventLoop.

---

## Commandes

| Action | Commande |
|---|---|
| API (reload) | `uvicorn app.main:app --reload` |
| Worker d'ingestion | `python -m ingestion.worker` |
| Migration (créer) | `alembic revision --autogenerate -m "msg"` |
| Migration (appliquer) | `alembic upgrade head` |
| Tests | `pytest` |
| Lint | `ruff check .` |
| Stack complète | `docker compose up` |
| Seed matchs futurs (démo pronos) | `python -m ingestion.seed_future_matches --count 24 --replace` |

---

## Configuration (`.env`)

Modèle complet : [.env.example](.env.example). Principales variables :

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | connexion PostgreSQL (`...@localhost:5433/clutch` en local) |
| `LIQUIPEDIA_API_KEY` / `LIQUIPEDIA_USER_AGENT` | accès LPDB (UA descriptif **obligatoire**) |
| `EWC_TOURNAMENTS` | `{gameId: pagename}` des tournois à ingérer (ajout/retrait sans toucher au code) |
| `INGEST_INTERVAL_MINUTES` | fréquence du worker (défaut 15) |
| `DISPLAY_TZ` | fuseau de **sortie** des `date`/`time` (stockage interne en UTC) |
| `CORS_ORIGINS` | origines front autorisées (jamais `*`) |
| `SUPABASE_JWT_SECRET` / `SUPABASE_URL` / `SUPABASE_ANON_KEY` | vérification des JWT |
| `SCORING_INTERVAL_SECONDS` | fréquence du scoring (défaut 60) |
| `WEBHOOK_SECRET` | secret webhook Liquipedia (optionnel) |

---

## API — endpoints

Contrat détaillé : [docs/CONTRAT-API.md](docs/CONTRAT-API.md). Swagger sur `/docs`.

| Endpoint | Réponse | Notes |
|---|---|---|
| `GET /games` | `Game[]` | ordre fixe (`GAME_ORDER`) |
| `GET /teams` · `GET /teams/{id}` | `Team[]` / `Team` | tri alphabétique |
| `GET /matches` · `GET /matches/{id}` | `Match[]` / `Match` | filtres `game/team/day/status/q` |
| `GET /me` | `User` | utilisateur courant (JWT) |
| `GET /groups` · `GET /groups/{id}` | `Group[]` / `Group` | groupes de l'utilisateur |
| `POST /groups` · `POST /groups/join` | `Group` | création / rejoindre via `code` |
| `GET /leaderboard` | `LeaderboardEntry[]` | `?limit=` (défaut 50), tri points desc |
| `GET` / `POST /predictions` | `PredictionMap` / `Prediction` | prono refusé si match non `upcoming` |

**Invariants** : JSON camelCase ; statuts `upcoming`/`live`/`done` (jamais
`finished`) ; `bestOf` = `"BO1"/"BO3"/"BO5"` ; `teamA`/`teamB` = objets `Team`
embarqués ; champs optionnels absents (`exclude_none`), pas de `null` parasite.

**Scoring pronostics** — paliers **exclusifs** : `25` pts (score exact), sinon
`10` (bon vainqueur), sinon `0`. Prono uniquement sur match `upcoming` non
commencé. Exécuté côté API (jamais le worker) quand un match passe à `done`.

---

## Ingestion Liquipedia

- Accès via **`liquipydia` uniquement** — jamais d'appel HTTP direct ni de
  scraping, jamais par requête utilisateur.
- **Rate limit : 60 req/h** → intervalle fixe, cache, sélection de champs.
  Une seule instance du worker.
- **User-Agent descriptif avec contact** obligatoire (les UA génériques sont
  bloqués).
- Heures **normalisées en UTC** à l'ingestion.
- Matchs sans équipes désignées (**TBD**) ignorés : une édition future avant son
  bracket ne ramène aucune donnée affichable → pour une démo, pointer une
  édition passée (ex. `Esports_World_Cup/2025`).
- **Attribution CC-BY-SA 3.0** exposée dans les métadonnées de l'API.

---

## Tests

```bash
pytest                 # SQLite via aiosqlite (mêmes modèles), pas de Postgres requis
```
