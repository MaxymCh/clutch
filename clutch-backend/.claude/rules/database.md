# Base de données — règles

## Séparation stricte des modèles

- `app/models/catalog.py` — données INGÉRÉES (games, teams, matches) :
  miroir Liquipedia, lecture seule pour l'API, écrites uniquement par
  `ingestion/worker.py`. Le worker n'importe QUE ce module.
- `app/models/community.py` — données APPLICATIVES (users, groups,
  memberships, predictions) : lecture-écriture par l'API, jamais touchées
  par le worker.

## Conventions

- SQLAlchemy 2.0 style (`Mapped[...]`, `mapped_column`), `DeclarativeBase`
  commune dans `app/models/base.py`.
- Horodatages : `DateTime(timezone=True)`, TOUJOURS en UTC en base.
  La conversion vers `DISPLAY_TZ` se fait à la sérialisation Pydantic.
- `Match.extradata` : colonne JSON pour les spécificités par jeu, sans
  casser le schéma commun.
- Clés primaires `String` pour le catalog (ids stables dérivés de
  Liquipedia), UUID hex pour la communauté.
- Toute évolution de schéma passe par une migration Alembic
  (`alembic revision --autogenerate` puis relecture manuelle du script).
- Tests : SQLite via aiosqlite (mêmes modèles), Postgres en démo/prod.
