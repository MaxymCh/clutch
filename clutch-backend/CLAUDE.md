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
Try `python -h' for more information.
PS C:\etna\clutch-backend> venv\Scripts\activate  
(venv) PS C:\etna\clutch-backend> alembic upgrade head  
Traceback (most recent call last):
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 144, in __init__
    self._dbapi_connection = engine.raw_connection()
                             ~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 3319, in raw_connection
    return self.pool.connect()
           ~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 448, in connect
    return _ConnectionFairy._checkout(self)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 1272, in _checkout
    fairy = _ConnectionRecord.checkout(pool)
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 712, in checkout
    rec = pool._do_get()
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\impl.py", line 307, in _do_get
    return self._create_connection()
           ~~~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 389, in _create_connection
    return _ConnectionRecord(self)
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 674, in __init__
    self.__connect()
    ~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 900, in __connect
    with util.safe_reraise():
         ~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\util\langhelpers.py", line 122, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 896, in __connect
    self.dbapi_connection = connection = pool._invoke_creator(self)
                                         ~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\create.py", line 667, in connect
    return dialect.connect(*cargs_tup, **cparams)
           ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\default.py", line 630, in connect
    return self.loaded_dbapi.connect(*cargs, **cparams)  # type: ignore[no-any-return]  # NOQA: E501
           ~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\psycopg\connection.py", line 130, in connect
    raise new_ex.with_traceback(None)
psycopg.OperationalError: connection failed: connection to server at "127.0.0.1", port 5432 failed: FATAL:  authentification par mot de passe �chou�e pour l'utilisateur  � clutch �
Multiple connection attempts failed. All failures were:
- host: 'localhost', port: 5432, hostaddr: '::1': connection failed: connection to server at "::1", port 5432 failed: FATAL:  authentification par mot de passe �chou�e pour l'utilisateur  � clutch �
- host: 'localhost', port: 5432, hostaddr: '127.0.0.1': connection failed: connection to server at "127.0.0.1", port 5432 failed: FATAL:  authentification par mot de passe �chou�e pour l'utilisateur  � clutch �

The above exception was the direct cause of the following exception:

Traceback (most recent call last):
  File "<frozen runpy>", line 198, in _run_module_as_main
  File "<frozen runpy>", line 88, in _run_code
  File "C:\etna\clutch-backend\venv\Scripts\alembic.exe\__main__.py", line 5, in <module>
    sys.exit(main())
             ~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\alembic\config.py", line 1047, in main
    CommandLine(prog=prog).main(argv=argv)
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\alembic\config.py", line 1037, in main
    self.run_cmd(cfg, options)
    ~~~~~~~~~~~~^^^^^^^^^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\alembic\config.py", line 971, in run_cmd
    fn(
    ~~^
        config,
        ^^^^^^^
        *[getattr(options, k, None) for k in positional],
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
        **{k: getattr(options, k, None) for k in kwarg},
        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\alembic\command.py", line 483, in upgrade
    script.run_env()
    ~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\alembic\script\base.py", line 545, in run_env
    util.load_python_file(self.dir, "env.py")
    ~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\alembic\util\pyfiles.py", line 116, in load_python_file
    module = load_module_py(module_id, path)
  File "C:\etna\clutch-backend\venv\Lib\site-packages\alembic\util\pyfiles.py", line 136, in load_module_py
    spec.loader.exec_module(module)  # type: ignore
    ~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^
  File "<frozen importlib._bootstrap_external>", line 762, in exec_module
  File "<frozen importlib._bootstrap>", line 491, in _call_with_frames_removed
  File "C:\etna\clutch-backend\alembic\env.py", line 51, in <module>
    run_migrations_online()
    ~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\alembic\env.py", line 42, in run_migrations_online
    with connectable.connect() as connection:
         ~~~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 3295, in connect
    return self._connection_cls(self)
           ~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 146, in __init__
    Connection._handle_dbapi_exception_noconnection(
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~^
        err, dialect, engine
        ^^^^^^^^^^^^^^^^^^^^
    )
    ^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 2450, in _handle_dbapi_exception_noconnection
    raise sqlalchemy_exception.with_traceback(exc_info[2]) from e
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 144, in __init__
    self._dbapi_connection = engine.raw_connection()
                             ~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\base.py", line 3319, in raw_connection
    return self.pool.connect()
           ~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 448, in connect
    return _ConnectionFairy._checkout(self)
           ~~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 1272, in _checkout
    fairy = _ConnectionRecord.checkout(pool)
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 712, in checkout
    rec = pool._do_get()
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\impl.py", line 307, in _do_get
    return self._create_connection()
           ~~~~~~~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 389, in _create_connection
    return _ConnectionRecord(self)
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 674, in __init__
    self.__connect()
    ~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 900, in __connect
    with util.safe_reraise():
         ~~~~~~~~~~~~~~~~~^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\util\langhelpers.py", line 122, in __exit__
    raise exc_value.with_traceback(exc_tb)
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\pool\base.py", line 896, in __connect
    self.dbapi_connection = connection = pool._invoke_creator(self)
                                         ~~~~~~~~~~~~~~~~~~~~^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\create.py", line 667, in connect
    return dialect.connect(*cargs_tup, **cparams)
           ~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\sqlalchemy\engine\default.py", line 630, in connect
    return self.loaded_dbapi.connect(*cargs, **cparams)  # type: ignore[no-any-return]  # NOQA: E501
           ~~~~~~~~~~~~~~~~~~~~~~~~~^^^^^^^^^^^^^^^^^^^
  File "C:\etna\clutch-backend\venv\Lib\site-packages\psycopg\connection.py", line 130, in connect
    raise new_ex.with_traceback(None)
sqlalchemy.exc.OperationalError: (psycopg.OperationalError) connection failed: connection to server at "127.0.0.1", port 5432 failed: FATAL:  authentification par mot de passe �chou�e pour l'utilisateur  � clutch �
Multiple connection attempts failed. All failures were:
- host: 'localhost', port: 5432, hostaddr: '::1': connection failed: connection to server at "::1", port 5432 failed: FATAL:  authentification par mot de passe �chou�e pour l'utilisateur  � clutch �
- host: 'localhost', port: 5432, hostaddr: '127.0.0.1': connection failed: connection to server at "127.0.0.1", port 5432 failed: FATAL:  authentification par mot de passe �chou�e pour l'utilisateur  � clutch �
(Background on this error at: https://sqlalche.me/e/20/e3q8)
(venv) PS C:\etna\clutch-backend> uvicorn app.main:app --reload
INFO:     Will watch for changes in these directories: ['C:\\etna\\clutch-backend']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [28140] using WatchFiles
INFO:     Started server process [30528]
INFO:     Waiting for application startup.
INFO:apscheduler.scheduler:Adding job tentatively -- it will be properly scheduled when the scheduler starts
INFO:apscheduler.scheduler:Added job "_run_scoring" to job store "default"
INFO:apscheduler.scheduler:Scheduler started
INFO:     Application startup complete.
INFO:     Shutting down
INFO:     Waiting for application shutdown.
INFO:apscheduler.scheduler:Scheduler has been shut down
INFO:     Application shutdown complete.
INFO:     Finished server process [30528]
INFO:     Stopping reloader process [28140]