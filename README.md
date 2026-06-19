# Clutch 🎮

**Clutch** est une PWA esport qui agrège les matchs de l'**Esports World Cup**
en un calendrier unifié — filtrable par jeu et par équipe — et y ajoute une
dimension **communautaire** : pronostics, scoring, groupes et classements.

> Projet étudiant **ETNA** (sprint 168h). Identité propre, **non affiliée** à
> l'Esports World Cup. Données esport issues de **Liquipedia** (CC-BY-SA 3.0).

🌐 Production : **[clutch-esports.eu](https://clutch-esports.eu)** · API : `api.clutch-esports.eu`

---

## Monorepo

| Dossier | Rôle | README |
|---|---|---|
| [`clutch-frontend/`](clutch-frontend) | PWA React 19 + Vite (web + mobile Capacitor) | [README front](clutch-frontend/README.md) |
| [`clutch-backend/`](clutch-backend) | API FastAPI + worker d'ingestion Liquipedia | [README back](clutch-backend/README.md) |

Documentation transverse :

- **[DEPLOYMENT.md](DEPLOYMENT.md)** — architecture de prod, CI/CD, exploitation, dépannage.
- **[clutch-backend/docs/CONTRAT-API.md](clutch-backend/docs/CONTRAT-API.md)** — contrat de données (source de vérité).

---

## Architecture en bref

```
                        Supabase Auth (cloud) ──── JWT (Bearer)
                              ▲
  Navigateur / Mobile ────────┤ HTTPS
        │                     │
        ├──▶ clutch-esports.eu        → Cloudflare Pages (front PWA statique)
        │
        └──▶ api.clutch-esports.eu    → Cloudflare Tunnel
                                            ▼
                          VPS — Docker Compose
                          ┌─────────┬──────────┬────────────┐
                          │ api     │ worker   │ db          │
                          │ FastAPI │ ingestion│ PostgreSQL  │
                          └─────────┴──────────┴────────────┘
                                          ▲
                          worker ◀── Liquipedia (LPDB v3, 60 req/h)
```

**Deux natures de données, jamais mélangées :**

- **Catalog** (ingéré) — `games`, `teams`, `matches` : miroir **lecture seule**
  de Liquipedia, écrit **uniquement** par le worker.
- **Community** (applicatif) — `users`, `groups`, `predictions`, leaderboard :
  données possédées par l'app, lecture-écriture par l'API, **jamais** touchées
  par le worker.

**Authentification** : Supabase (JWT). Supabase ne sert **que** d'auth ; toutes
les données applicatives vivent dans le PostgreSQL self-hosted.

---

## Stack

| Brique | Techno |
|---|---|
| Front | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, PWA, Capacitor |
| Back | FastAPI (Python 3.12), Pydantic v2, SQLAlchemy 2, Alembic, APScheduler |
| Ingestion | `liquipydia` (LPDB v3) |
| DB | PostgreSQL 16 |
| Auth | Supabase (JWT) |
| Infra | Docker Compose, Cloudflare Pages + Tunnel, CI GitLab |

---

## Démarrage rapide (dev local)

### Tout en Docker (recommandé)

```bash
# Backend (API + worker + db)
cd clutch-backend
cp .env.example .env          # remplir les secrets (Supabase, Liquipedia)
docker compose up

# Frontend
cd ../clutch-frontend
cp .env.example .env          # VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm install
npm run dev                   # http://localhost:5173 (proxy /api → :8000)
```

> ⚠️ **Sous Windows hors Docker**, l'API async plante avec le ProactorEventLoop
> par défaut : préférer Docker (DB dev exposée sur le port **5433**).

Détails complets : voir les READMEs [front](clutch-frontend/README.md) et
[back](clutch-backend/README.md).

---

## Licence & attribution

Les données esport proviennent de **[Liquipedia](https://liquipedia.net)**, sous
licence **CC-BY-SA 3.0**. L'API expose cette attribution dans ses métadonnées
(en-tête `X-Data-Attribution`). Projet étudiant non commercial.
