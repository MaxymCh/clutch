docker compose up db -d  
docker compose build api
docker compose run --rm api alembic upgrade head
docker compose run --rm worker

docker compose down -v
docker compose build
docker compose up

docker compose run --rm api python -m ingestion.seed_future_matches --count 24 --replace
