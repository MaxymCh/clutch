"""Modèles ORM des données INGÉRÉES (miroir Liquipedia, lecture seule).

⚠️ Frontière stricte : ces tables sont écrites UNIQUEMENT par
`ingestion/worker.py`. L'API les lit, ne les modifie jamais.
Le worker n'importe QUE ce module (jamais community.py).
"""

from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.models.base import Base


def utcnow() -> datetime:
    """Maintenant en UTC (aware) — règle : UTC partout en base."""
    return datetime.now(timezone.utc)


class Game(Base):
    """Jeu de la compétition (catalogue fixe, contrat front)."""

    __tablename__ = "games"

    # GameId du contrat front : val | lol | cs2 | dota | rl | ow | apex | r6 | …
    id: Mapped[str] = mapped_column(String(8), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    short: Mapped[str] = mapped_column(String(16))
    tag: Mapped[str] = mapped_column(String(8))
    # Ordre d'affichage imposé par le front (GAME_ORDER)
    sort_order: Mapped[int] = mapped_column(Integer)
    # URL de l'image de fond des cartes jeu (chemin local ou CDN)
    bg_url: Mapped[str] = mapped_column(String(256), default="")
    # Icône/logo du jeu (chemin local, ex. /games/icons/val.svg)
    logo_url: Mapped[str | None] = mapped_column(String(256), nullable=True)
    # Logo horizontal complet (chemin local, ex. /games/full-logo/val.svg)
    full_logo_url: Mapped[str | None] = mapped_column(String(256), nullable=True)


class Team(Base):
    """Équipe participante (ingérée depuis Liquipedia)."""

    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(128))
    tag: Mapped[str] = mapped_column(String(16))
    country_code: Mapped[str] = mapped_column(String(2))
    # --- Colonnes internes d'ingestion (jamais exposées par l'API) ---
    # Template Liquipedia (source du tag via /teamtemplate) et wiki d'origine.
    template: Mapped[str | None] = mapped_column(String(64), nullable=True)
    wiki: Mapped[str | None] = mapped_column(String(32), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    # True quand tag/pays ont été enrichis via Liquipedia (gestion du quota).
    enriched: Mapped[bool] = mapped_column(Boolean, default=False)
    # True quand le roster (joueurs) a été récupéré via /squadplayer.
    roster_loaded: Mapped[bool] = mapped_column(Boolean, default=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    # Roster ingéré depuis Liquipedia (chargé explicitement, jamais en lazy async).
    players: Mapped[list["Player"]] = relationship(
        back_populates="team",
        cascade="all, delete-orphan",
        order_by="Player.sort_order",
    )


class Player(Base):
    """Joueur d'une équipe (roster ingéré depuis Liquipedia /squadplayer)."""

    __tablename__ = "players"

    # Id stable dérivé de team_id + page/nick Liquipedia.
    id: Mapped[str] = mapped_column(String(192), primary_key=True)
    team_id: Mapped[str] = mapped_column(ForeignKey("teams.id"), index=True)
    # Jeu de l'effectif (val, lol, cs2…) : une équipe peut aligner un roster
    # par jeu. Déduit du match où le joueur a été vu. Nullable tant que non
    # ré-ingéré (anciens enregistrements).
    game_id: Mapped[str | None] = mapped_column(ForeignKey("games.id"), index=True, nullable=True)
    # Pseudo in-game (affiché) ; nom réel non exposé par l'API.
    name: Mapped[str] = mapped_column(String(128))
    country_code: Mapped[str] = mapped_column(String(2), default="XX")
    # Poste/rôle ("Duelist", "Mid", "IGL"…) si fourni par la source.
    role: Mapped[str | None] = mapped_column(String(48), nullable=True)
    # Ordre d'affichage (ordre du roster source).
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    team: Mapped[Team] = relationship(back_populates="players")


class Match(Base):
    """Match du tournoi — la forme suit le contrat front, pas LPDB."""

    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(128), primary_key=True)
    game_id: Mapped[str] = mapped_column(ForeignKey("games.id"), index=True)
    team_a_id: Mapped[str] = mapped_column(ForeignKey("teams.id"), index=True)
    team_b_id: Mapped[str] = mapped_column(ForeignKey("teams.id"), index=True)
    # upcoming | live | done (valeurs EXACTES du front)
    status: Mapped[str] = mapped_column(String(8), index=True)
    phase: Mapped[str] = mapped_column(String(64))
    # "BO1" | "BO3" | "BO5" (chaînes, contrat front)
    best_of: Mapped[str] = mapped_column(String(3))
    # Timestamp UNIQUE en UTC ; date/time du contrat sont dérivées à la
    # sérialisation dans DISPLAY_TZ.
    start_time_utc: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    score_a: Mapped[int | None] = mapped_column(Integer, nullable=True)
    score_b: Mapped[int | None] = mapped_column(Integer, nullable=True)
    # Cartes déjà au format du front : [{name, scoreA, scoreB, winner?, live?}]
    maps: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    current_map_label: Mapped[str | None] = mapped_column(String(64), nullable=True)
    viewers: Mapped[str | None] = mapped_column(String(16), nullable=True)
    # Liens de diffusion au format du front : [{platform, url}] (streamurls LPDB).
    streams: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    # Veto des cartes : [{order, type, team, map}] (extradata.mapveto LPDB).
    veto: Mapped[list[dict[str, Any]] | None] = mapped_column(JSON, nullable=True)
    # Spécificités par jeu sans casser le schéma commun
    extradata: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    team_a: Mapped[Team] = relationship(foreign_keys=[team_a_id], lazy="joined")
    team_b: Mapped[Team] = relationship(foreign_keys=[team_b_id], lazy="joined")
