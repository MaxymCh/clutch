# Sécurité & session — règles

## Auth (validée — ne pas étendre sans accord)

- **Session anonyme par cookie httpOnly signé** (`itsdangerous`). Aucun
  écran de login côté front : pas d'email/mot de passe, pas d'OAuth, pas de
  vérification email, pas de récupération de compte.
- Premier appel `GET /me` sans cookie valide → création d'un user
  (pseudo `clutcher_XXXX`, tag dérivé, `countryCode` déduit de
  `Accept-Language`, fallback `FR`) + pose du cookie.
- Cookie : `httpOnly`, `SameSite=None` + `Secure` quand `COOKIE_SECURE=true`
  (front et back sur des origines différentes) ; en dev local `Lax` + non
  Secure. Durée longue (tournoi).
- Note branchement front : le client devra envoyer `credentials: 'include'`.

## Règles générales

- Secrets uniquement via `.env` (`SESSION_SECRET`, `LIQUIPEDIA_API_KEY`).
  Jamais en dur, jamais commités (`.env` est dans `.gitignore`).
- CORS : liste explicite `CORS_ORIGINS` + `allow_credentials=True`.
  Jamais `allow_origins=["*"]` (incompatible avec les cookies, de toute façon).
- La clé Liquipedia n'est utilisée QUE par `ingestion/`, jamais par l'API.
- Validation d'entrée par Pydantic ; erreurs via `HTTPException`.
