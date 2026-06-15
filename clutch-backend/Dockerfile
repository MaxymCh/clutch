# liquipydia exige Python 3.12+
FROM python:3.12-slim

WORKDIR /srv/clutch

# Dépendances d'abord (cache de build), code ensuite.
COPY pyproject.toml ./
COPY app ./app
COPY ingestion ./ingestion
COPY alembic ./alembic
COPY alembic.ini ./

RUN pip install --no-cache-dir .

EXPOSE 8000
