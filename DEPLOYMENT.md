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

## 5. CI/CD — ce qui est automatique

| Brique | Statut | Comment |
|---|---|---|
| **Front** | ✅ automatique | push → GitHub → Cloudflare Pages rebuild & déploie |
| **Back** | ⚠️ manuel (par défaut) | `git pull` + `docker compose up -d` sur le VPS |
| **Tests** | ✅ (GitLab CI) | `ruff`+`pytest` (back), `lint`+`build` (front) à chaque MR |

### Redéployer le backend à la main
```bash
ssh chape_m@172.16.248.100
cd ~/group-1076817
git pull
docker compose -f docker-compose.prod.yml -f docker-compose.tunnel.yml up -d --build
docker image prune -f
```

### Rendre le backend automatique (runner GitLab self-hosted)
Le VPS étant **VPN-only**, le runner cloud GitLab ne peut pas l'atteindre. Pour
automatiser, installer un runner **sur le VPS** :
```bash
# Sur le VPS
curl -L "https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh" | sudo bash
sudo apt-get install gitlab-runner
sudo gitlab-runner register      # URL + token du projet (GitLab → Settings → CI/CD → Runners)
                                 # executor: shell
sudo usermod -aG docker gitlab-runner
```
Puis variables CI/CD (GitLab → Settings → CI/CD → Variables) :
`SSH_*` ne sont plus nécessaires si le job tourne en local sur le VPS — adapter
`deploy:backend` dans `.gitlab-ci.yml` pour exécuter directement
`cd $DEPLOY_PATH && git pull && docker compose ... up -d` sur le runner shell.

> Le fichier [.gitlab-ci.yml](.gitlab-ci.yml) contient déjà un job `deploy:backend`
> en version SSH ; il suffit de l'activer via un runner joignable.

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

---

## 9. Référence des fichiers

| Fichier | Rôle |
|---|---|
| [docker-compose.prod.yml](docker-compose.prod.yml) | stack backend (api/worker/db) |
| [docker-compose.tunnel.yml](docker-compose.tunnel.yml) | service `cloudflared` (tunnel) |
| [.env.prod.example](.env.prod.example) | modèle de config backend |
| [.gitlab-ci.yml](.gitlab-ci.yml) | tests + déploiement backend |
| [clutch-backend/Dockerfile](clutch-backend/Dockerfile) | image API/worker |
| [clutch-frontend/vite.config.ts](clutch-frontend/vite.config.ts) | build front + proxy `/api` en dev |
