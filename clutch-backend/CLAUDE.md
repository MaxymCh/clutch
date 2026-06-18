# Clutch Backend — FastAPI Project Guide

## 🎯 Purpose (Why)

API REST qui alimente le frontend Clutch (calendrier EWC 2026 + communauté).
Deux natures de données à ne JAMAIS mélanger :

- **Catalog (ingéré)** : matches, teams, games = miroir LECTURE SEULE de
  Liquipedia, écrit UNIQUEMENT par le worker d'ingestion.
- **Community (applicatif)** : users, groups, leaderboard = données POSSÉDÉES
  par l'app, lecture-écriture, JAMAIS touchées par le worker.

## ⚖️ Règle suprême : le frontend fait foi

Le front est terminé et ne sera pas modifié. Les schémas de sortie doivent
reproduire À L'IDENTIQUE les types TS du front (mêmes noms de champs JSON,
mêmes types, mêmes valeurs d'enum). En cas de divergence ou d'ambiguïté :
s'arrêter et demander, ne jamais inventer le contrat.

## 🛠️ Tech Stack (What)

- **Framework:** FastAPI (Python 3.11+), async/await.
- **Validation:** Pydantic v2 (strict).
- **ORM / DB:** SQLAlchemy + PostgreSQL, migrations Alembic.
- **Ingestion:** client `liquipydia` UNIQUEMENT (jamais d'appel HTTP direct ni
  de scraping). Version épinglée.
- **Scheduler:** APScheduler pour le worker.

## 🗂️ Project Layout (architecture imposée — fait foi)

app/
├── main.py # app FastAPI, CORS, montage des routers
├── api/ # endpoints (matches, teams, games, users, groups, leaderboard)
├── schemas/ # Pydantic = contrat API = COPIE FIDÈLE des types du front
├── models/ # ORM SQLAlchemy : catalog.py (ingéré) + community.py (applicatif)
├── services/ # logique de lecture/écriture en base
└── core/ # config (.env via BaseSettings), session DB, sécurité
ingestion/
├── liquipedia.py # wrapper liquipydia (clé API, User-Agent, rate limit, cache)
├── normalize.py # mapping Liquipedia → modèle commun (forme du front)
└── worker.py # job planifié qui écrit en base (importe SEULEMENT catalog)
alembic/ · tests/ · docker-compose.yml · pyproject.toml · .env.example
⚠️ Schémas Pydantic dans `app/schemas/`, PAS dans `models/`. `models/` = ORM.

## ⚙️ Commands (How)

- **Env (Win):** `venv\Scripts\activate`
- **Dev API:** `uvicorn app.main:app --reload`
- **Worker:** `python -m ingestion.worker`
- **Migrations:** `alembic upgrade head`
- **Tests:** `pytest`
- **Stack complète:** `docker compose up`

## 🐍 Code & Best Practices

- **Langue:** réponses et commentaires en français ; code (variables, classes,
  chemins) strictement en anglais.
- **Async:** `async def` pour les endpoints ; `def` seulement si une dépendance
  n'a pas de support async.
- **Pydantic:** séparer les modèles Request et Response (`MatchIn`/`MatchOut`).
  Toujours `response_model` sur les routers pour filtrer la sortie. Utiliser des
  alias si l'interne est en snake_case mais que le front attend autre chose.
- **Erreurs:** jamais de dict d'erreur brut. Lever `HTTPException(...)` ou des
  handlers centraux.
- **CORS:** liste `origins` explicite dans `main.py` (l'URL du front). JAMAIS
  `allow_origins=["*"]`. Obligatoire : front et back sont sur des origines différentes.
- **Dépendances:** injection via `Depends()` (session DB, auth).
- **Secrets:** config par `.env` (Pydantic BaseSettings). Aucun secret en dur ni commité.

## 🔒 Règles Liquipedia (ingestion)

- Accès via `liquipydia` uniquement. Clé API + **User-Agent descriptif avec
  contact** lus depuis `.env` (User-Agent génériques bloqués).
- **Rate limit : 60 req/h.** Worker à intervalle fixe, cache, sélection de champs
  et requêtes multi-wikis pour économiser le quota. Jamais d'appel par requête utilisateur.
- **Attribution CC-BY-SA** Liquipedia exposée dans les métadonnées de l'API.
- Heures normalisées en **UTC** à l'ingestion.

## 🧠 Progressive Knowledge (More Rules)

Ne pas deviner. Lire le fichier dédié AVANT de coder le sujet :

- Modèles DB & migrations : `.claude/rules/database.md`
- Auth & flux JWT : `.claude/rules/security.md`
- Contrat de données aligné sur le front : `.claude/rules/api-contract.md`
