docker compose up -d db api

docker compose build api

docker compose run --rm api python -m ingestion.seed_future_matches --count 24 --replace
