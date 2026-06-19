# Sécurité & session — règles

## Auth (validée — ne pas étendre sans accord)

- **Authentification Supabase (JWT).** Le front se connecte via le SDK
  `@supabase/supabase-js` et reçoit un **JWT**. Chaque appel API envoie
  `Authorization: Bearer <token>`. Supabase ne sert QUE d'authentification ;
  toutes les données applicatives vivent dans le PostgreSQL self-hosted.
- Vérification du JWT côté API via le **JWKS** Supabase
  (`app/core/security.py`) — algorithmes **ES256** (Google OAuth) et **HS256**,
  audience `authenticated`. L'id utilisateur = `sub` du token (UUID sans tirets).
- Au premier appel authentifié (`get_current_user`, `app/api/deps.py`), l'API
  crée le profil dans **sa** base (table `users`, clé = l'id Supabase) :
  pseudo `clutcher_XXXX`, `tag`, `countryCode` (`FR` par défaut). Race condition
  gérée (IntegrityError → refetch).
- `POST /auth/token` (`app/api/auth.py`) sert UNIQUEMENT à obtenir un token
  depuis Swagger (`/docs`) pour tester l'API ; le front n'en a pas besoin.

> Note historique : une session anonyme par cookie httpOnly avait été envisagée
> au début du projet ; l'auth retenue et déployée est **Supabase JWT**.

## Règles générales

- Secrets uniquement via `.env` (`SUPABASE_JWT_SECRET`, `SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `LIQUIPEDIA_API_KEY`). Jamais en dur, jamais commités
  (`.env` est dans `.gitignore`).
- CORS : liste explicite `CORS_ORIGINS` (jamais `allow_origins=["*"]`),
  `Authorization` autorisé dans les en-têtes.
- La clé Liquipedia n'est utilisée QUE par `ingestion/`, jamais par l'API.
- Validation d'entrée par Pydantic ; erreurs via `HTTPException`.
