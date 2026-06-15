# Clutch — Documentation de déploiement

Déploiement public de Clutch (calendrier EWC + communauté).
Domaine : **clutch-esports.eu**.

---

## 1. Architecture en production

```
                          ┌──────────────────────────┐
   Navigateur / Mobile ──▶│ Supabase Auth (cloud)    │  JWT (Bearer)
        │                 └──────────────────────────┘
        │ HTTPS
        ├─────────────▶  clutch-esports.eu        → Cloudflare Pages (front PWA, statique)
        │
        └─────────────▶  api.clutch-esports.eu    → Cloudflare Tunnel
                                                         │  (sortant, pas d'IP publique)
                                                         ▼
                                   VPS (172.16.248.100, VPN-only) — Docker Compose
                                   ┌─────────────┬───────────────┬──────────────┐
                                   │ api         │ worker        │ db           │
                                   │ (FastAPI)   │ (ingestion)   │ (PostgreSQL) │
                                   └─────────────┴───────────────┴──────────────┘
                                          ▲ lecture          ▲ écriture (catalog)
                                          └── même base PostgreSQL ──┘
                                                       ▲
                                   worker ◀── Liquipedia (LPDB v3, 60 req/h)
```

### Briques et rôles
| Brique | Techno | Où | Public |
|---|---|---|---|
| **Front** | React 19 + Vite (PWA) | Cloudflare Pages | `https://clutch-esports.eu` (+ `www`) |
| **API** | FastAPI (Python 3.12) | VPS, conteneur `api` | `https://api.clutch-esports.eu` (via tunnel) |
| **Worker** | APScheduler + liquipydia | VPS, conteneur `worker` | interne |
| **DB** | PostgreSQL 16 | VPS, conteneur `db` | interne (loopback) |
| **Auth** | Supabase (JWT) | Cloud Supabase | géré par Supabase |

> ⚠️ **Supabase ne sert QUE d'authentification.** Les données applicatives
> (users, groupes, pronos) et le catalogue (matchs/équipes) vivent dans le
> **PostgreSQL self-hosted du VPS**, pas dans Supabase.

---

## 2. Authentification (Supabase)

- Le front se connecte via le SDK `@supabase/supabase-js` → reçoit un **JWT**.
- Chaque appel API envoie `Authorization: Bearer <token>`.
- L'API vérifie le JWT via le **JWKS** Supabase (`app/core/security.py`, ES256/HS256).
- Au premier appel authentifié, l'API crée un profil utilisateur dans **sa** base
  (table `users`, clé = l'id Supabase) — voir `app/api/deps.py`.

### Config Supabase (Authentication → URL Configuration)
- **Site URL** : `https://clutch-esports.eu`
- **Redirect URLs** :
  ```
  https://clutch-esports.eu/**
  https://www.clutch-esports.eu/**
  http://localhost:5173/**
  ```
- Providers : Email activé (Google optionnel).

> Un **seul** projet Supabase sert le local ET la prod : seule la 3ᵉ Redirect URL
> (localhost) distingue le dev. Local et prod partagent donc les mêmes comptes.

---

## 3. Variables d'environnement

### Backend — `.env` (sur le VPS, jamais commité)
| Variable | Rôle |
|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | conteneur Postgres ; `DATABASE_URL` en est dérivé |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_JWT_SECRET` | vérification des JWT |
| `LIQUIPEDIA_API_KEY` / `LIQUIPEDIA_USER_AGENT` | worker d'ingestion |
| `EWC_TOURNAMENTS` | `{gameId: pagename}` des tournois à ingérer |
| `INGEST_INTERVAL_MINUTES` | fréquence du worker (défaut 15) |
| `DISPLAY_TZ` | fuseau d'affichage (UTC en base) |
| `CORS_ORIGINS` | origines front autorisées |
| `CLOUDFLARE_TUNNEL_TOKEN` | token du tunnel |
| `SCORING_INTERVAL_SECONDS` | fréquence du scoring (dans l'API) |

Modèle : [.env.prod.example](.env.prod.example). Sur le VPS le fichier doit
s'appeler **`.env`** (Docker Compose le charge automatiquement).

### Frontend — variables Cloudflare Pages (Production)
| Variable | Valeur |
|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |
| `VITE_API_URL` | `https://api.clutch-esports.eu` |

### Les fichiers `.env` du repo
| Fichier | Usage | Commité ? |
|---|---|---|
| `clutch-backend/.env` | dev local du back | ❌ |
| `clutch-frontend/.env` | dev local du front | ❌ |
| `.env.prod.example` | modèle prod (sans secrets) | ✅ |
| `.env` (sur le VPS) | secrets prod réels | ❌ |

> En dev local, le front N'A PAS de `VITE_API_URL` : il utilise `/api`, proxifié
> vers `localhost:8000` par Vite (`vite.config.ts`).

---

## 4. Procédure de déploiement (de zéro)

### 4.1 Domaine (Cloudflare)
1. Cloudflare → **Add a site** `clutch-esports.eu` (plan Free).
2. Chez Hostinger : remplacer les nameservers par ceux de Cloudflare
   (`ezra.ns.cloudflare.com`, `nola.ns.cloudflare.com`), **DNSSEC OFF**.
3. Attendre le statut **Active**.
4. **SSL/TLS → Overview → Full** (jamais Flexible).

### 4.2 Supabase
Cf. §2 (clés + URL Configuration + providers).

### 4.3 Backend sur le VPS
```bash
ssh chape_m@172.16.248.100            # via le VPN école
curl -fsSL https://get.docker.com | sh
git clone <url-repo> ~/group-1076817
cd ~/group-1076817
cp .env.prod.example .env
nano .env                              # remplir tous les secrets
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml up -d --build
```

### 4.4 Tunnel Cloudflare (API publique)
1. Cloudflare **Zero Trust → Networks → Connectors → Create a tunnel** (type *Cloudflared*), nom `clutch-api`.
2. Copier le **token** → `CLOUDFLARE_TUNNEL_TOKEN` dans `.env` du VPS.
3. **Public Hostname** : `api` . `clutch-esports.eu` → **HTTP** → `api:8000`.
4. Vérifier : tunnel **HEALTHY** + `https://api.clutch-esports.eu/docs` répond.

### 4.5 Frontend (Cloudflare Pages)
1. Pages → **Connect to Git → GitHub** → repo (cf. §6 pour la synchro Git).
2. Build : **Root directory** `clutch-frontend`, command `npm run build`, output `dist`.
3. Variables d'env (cf. §3).
4. **Custom domains** : `clutch-esports.eu` + `www.clutch-esports.eu`.

---

## 5. CI/CD — entièrement automatique

À chaque `git push origin main` :

| Brique | Statut | Comment |
|---|---|---|
| **Front** | ✅ automatique | push → GitHub (double-remote) → Cloudflare Pages rebuild & déploie |
| **Back** | ✅ automatique | pipeline GitLab → job `deploy:backend` sur le runner du VPS |

### Pipeline GitLab ([.gitlab-ci.yml](.gitlab-ci.yml))
Le runner est un **runner self-hosted installé SUR le VPS** (executor `shell`).
Comme le VPS n'a ni Python ni Node, les jobs de qualité tournent **dans des
conteneurs Docker** lancés par le runner ; le déploiement, lui, tourne
directement sur l'hôte (accès Docker local).

| Job | Stage | Bloquant ? | Rôle |
|---|---|---|---|
| `lint:backend` | test | ✅ oui | `ruff` (conteneur `python:3.12-slim`) |
| `test:backend` | test | ⚠️ `allow_failure` | `pytest` (conteneur `python`) |
| `test:frontend` | test | ⚠️ `allow_failure` | `npm lint`+`build` (conteneur `node:22-alpine`) |
| `deploy:backend` | deploy | — | resync `main` + `docker compose up -d` sur le VPS |

> ⚠️ **`allow_failure` temporaire** sur `test:backend` et `test:frontend` :
> 6 tests communauté datent de l'ancienne auth cookie et tombent en 401 avec le
> JWT Supabase. À réécrire (override d'auth JWT dans `conftest`), puis retirer
> les `allow_failure` pour réactiver les barrières.
> Le build front reste protégé par **Cloudflare Pages** (un build cassé n'est
> pas déployé), même si le job GitLab est non-bloquant.

### Installation du runner (déjà fait — pour mémoire)
```bash
# Sur le VPS
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt-get install -y gitlab-runner
sudo gitlab-runner register \
  --url https://rendu-git.etna-alternance.net --token <glrt-...> \
  --executor shell --description "VPS Clutch"   # tag : vps
sudo usermod -aG docker gitlab-runner
sudo systemctl restart gitlab-runner
```
Variable CI/CD à définir (GitLab → Settings → CI/CD → Variables) :
`DEPLOY_PATH = /home/chape_m/group-1076817`. Le `deploy:backend` se resynchronise
via le token de job CI (`CI_JOB_TOKEN`), pas de secret SSH à stocker.
Le paramètre global `GIT_CLEAN_FLAGS: none` évite les erreurs de nettoyage dues
aux fichiers créés en root par les conteneurs de test.

### Redéployer le backend à la main (si besoin, hors CI)
```bash
ssh chape_m@172.16.248.100
cd ~/group-1076817
git pull
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml up -d --build
docker image prune -f
```

---

## 6. Git — double remote (GitLab école + GitHub)

Cloudflare Pages ne se connecte qu'à GitHub.com / GitLab.com (pas au GitLab
auto-hébergé de l'école). On pousse donc aux deux d'un coup :
```bash
git remote set-url --add --push origin <url-gitlab-ecole>
git remote set-url --add --push origin <url-github-perso>
git remote -v          # doit montrer 2 lignes (push)
git push origin main   # → GitLab (rendu) + GitHub (déclenche Pages)
```

---

## 7. Exploitation (operations)

### Logs
```bash
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml ps
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml logs api --tail=50
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml logs worker --tail=50
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml logs cloudflared --tail=20
```

### Ingestion des données (worker)
- Le worker lit `EWC_TOURNAMENTS` et ingère les matchs depuis Liquipedia.
- **Les matchs sans équipes désignées (TBD) sont ignorés** : une édition future
  (ex. EWC 2026 avant son bracket) ne ramène donc aucune donnée affichable.
- Pour une **démo avec de vraies données**, pointer une édition passée :
  ```
  EWC_TOURNAMENTS={"val": "Esports_World_Cup/2025", "lol": "Esports_World_Cup/2025", "cs2": "Esports_World_Cup/2025"}
  ```
  puis `docker compose ... up -d worker`.
- ⚠️ **Rate limit Liquipedia : 60 req/h.** Ne pas relancer le worker en boucle.
- gameIds valides : `val, lol, cs2, dota, rl, ow`.

### Seed de matchs futurs (démo des pronostics)
Une édition passée (2025) ne contient que des matchs `done`. Pour avoir des
matchs **`upcoming`** (calendrier à venir + pronostics), un script génère des
rencontres futures fictives à partir des vrais matchs en base (vraies équipes,
créneaux inventés en 2026, phase suffixée « (Simulation) »).

```bash
# En local
docker compose run --rm api \
  python -m ingestion.seed_future_matches --count 24 --replace

# En prod (sur le VPS)
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml \
  run --rm api python -m ingestion.seed_future_matches --count 24 --replace
```
- **Prérequis** : avoir déjà ingéré de vraies données (les matchs source à cloner).
- `--replace` : **sans danger** — supprime uniquement les matchs seedés
  (id préfixé `seed-`), jamais les données ingérées depuis Liquipedia.
- Le **worker ne touche jamais** les matchs `seed-` (ids distincts) : ils
  cohabitent avec les vrais sans conflit, et restent `upcoming`.
- ⚠️ Ce sont des matchs **fictifs** : à ne seeder en prod que si tu assumes des
  rencontres « Simulation » sur le site public. Options : `--count`,
  `--start-in-hours`, `--spacing-hours`.

### Sauvegarde de la base (cron sur le VPS)
```bash
0 3 * * * cd ~/group-1076817 && docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U clutch clutch | gzip > ~/backups/clutch-$(date +\%F).sql.gz
```
Restauration :
```bash
gunzip -c ~/backups/clutch-AAAA-MM-JJ.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U clutch -d clutch
```

### Contraintes d'échelle (à respecter)
- **Worker : 1 seule instance** (rate limit Liquipedia).
- **API : 1 seule instance** (le scoring tourne dans le process API ; plusieurs
  instances = scoring en double).

---

## 8. Dépannage (problèmes rencontrés)

| Symptôme | Cause | Solution |
|---|---|---|
| Pages : `ENOENT package.json` | Root directory non défini | Root directory = `clutch-frontend` |
| Build TS : `signOut ... Promise<void>` | type de retour | `signOut: async () => { await supabase.auth.signOut(); }` |
| Domaine non sélectionnable dans le tunnel | domaine pas encore *Active* | finir les nameservers, attendre Active |
| `permission denied` sur docker | user hors groupe docker | `sudo usermod -aG docker chape_m` puis reconnexion |
| API vide, worker `0 upsertés / N ignorés` | matchs TBD (édition future) | pointer une édition passée (2025) |
| Erreur CORS au login | origine front absente | ajouter l'origine à `CORS_ORIGINS` + redéployer |
| Settings Supabase inaccessibles (Owner) | MFA/permission compte | activer la 2FA, se reconnecter |
| Login local redirige vers la prod | `redirectTo` non matché / Site URL figé | `redirectTo`/`emailRedirectTo` = `` `${origin}/` `` + `http://localhost:5173/**` dans Redirect URLs |
| CI : `pip`/`npm: command not found` | runner shell (pas de Python/Node sur l'hôte) | exécuter le job dans un conteneur (`docker run … python/node`) |
| CI : `permission denied` build dir | fichiers root créés par les conteneurs | `variables: GIT_CLEAN_FLAGS: none` |

---

## 9. Référence des fichiers

| Fichier | Rôle |
|---|---|
| [docker-compose.prod.yml](docker-compose.prod.yml) | stack backend (api/worker/db) |
| [docker-compose.tunnel.yml](docker-compose.tunnel.yml) | service `cloudflared` (tunnel) |
| [.env.prod.example](.env.prod.example) | modèle de config backend |
| [.gitlab-ci.yml](.gitlab-ci.yml) | tests + déploiement backend |
| [clutch-backend/Dockerfile](clutch-backend/Dockerfile) | image API/worker |
| [clutch-backend/ingestion/seed_future_matches.py](clutch-backend/ingestion/seed_future_matches.py) | seed de matchs futurs `upcoming` (démo pronostics) |
| [clutch-frontend/vite.config.ts](clutch-frontend/vite.config.ts) | build front + proxy `/api` en dev |
