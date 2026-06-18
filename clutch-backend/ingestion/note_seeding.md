# Seeding — outils de dev/démo

⚠️ Ces scripts sont réservés au développement et à la démo. Ne jamais exécuter en production.

## Scripts disponibles

### `seed_demo.py` — seed complet (calendrier + communauté)

Peuple la base avec des données réalistes pour tester l'app complète :
- Matchs `seed-*` étalés sur plusieurs semaines (done/live/upcoming selon l'heure courante)
- Utilisateurs `seed-u-*` avec pronos scorés
- Groupes `seed-g-*` avec membres

```bash
# Local — purge + reseed (défaut)
python -m ingestion.seed_demo

# Sans purger les données existantes
python -m ingestion.seed_demo --no-replace

# Avec plage de dates personnalisée
python -m ingestion.seed_demo --start-date 2026-05-25 --end-date 2026-07-31

# Docker
docker compose run --rm api python -m ingestion.seed_demo
```

### `seed_future_matches.py` — matchs à venir uniquement

Génère des matchs `upcoming` à partir des matchs existants en base, pour tester les parcours de pronostic.

```bash
# Local
python -m ingestion.seed_future_matches --count 24 --replace

# Docker
docker compose up -d db api
docker compose build api
docker compose run --rm api python -m ingestion.seed_future_matches --count 24 --replace
```

## Nettoyage

Toutes les entités créées par ces scripts sont préfixées `seed-`.
Relancer avec `--replace` (défaut pour `seed_demo`) purge automatiquement les entités `seed-*` sans toucher aux données réelles.
