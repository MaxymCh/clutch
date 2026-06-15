"""Modèles ORM des données APPLICATIVES (possédées par l'app).

⚠️ Frontière stricte : lecture-écriture par l'API uniquement. Le worker
d'ingestion ne touche JAMAIS à ces tables (et n'importe pas ce module).
`Prediction.match_id` référence un match du catalog par simple chaîne
(pas de FK) pour préserver cette frontière.
"""

from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base
from app.models.catalog import utcnow


class User(Base):
    """Utilisateur anonyme (session cookie) — points et série de pronos."""

    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    tag: Mapped[str] = mapped_column(String(8))
    country_code: Mapped[str] = mapped_column(String(2))
    points: Mapped[int] = mapped_column(Integer, default=0)
    # Pronostics gagnants d'affilée (bon vainqueur)
    streak: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    preferences: Mapped["UserPreferences | None"] = relationship(
        back_populates="user", lazy="selectin", uselist=False, cascade="all, delete-orphan"
    )


class UserPreferences(Base):
    """Préférences utilisateur synchronisées avec la base (thème, notifs, favoris)."""

    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), primary_key=True)
    theme: Mapped[str] = mapped_column(String(8), default="light")
    notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    onboarded: Mapped[bool] = mapped_column(Boolean, default=False)
    fav_teams: Mapped[list] = mapped_column(JSON, default=list)
    fav_games: Mapped[list] = mapped_column(JSON, default=list)

    user: Mapped[User] = relationship(back_populates="preferences")


class Group(Base):
    """Groupe de pronostics entre amis."""

    __tablename__ = "groups"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    emoji: Mapped[str] = mapped_column(String(8))
    # Code d'invitation partageable, unique (format type CLTCH-XXXX)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    memberships: Mapped[list["GroupMembership"]] = relationship(
        back_populates="group", lazy="selectin", cascade="all, delete-orphan"
    )


class GroupMembership(Base):
    """Appartenance d'un utilisateur à un groupe."""

    __tablename__ = "group_memberships"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_membership"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id"), index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    group: Mapped[Group] = relationship(back_populates="memberships")
    user: Mapped[User] = relationship(lazy="joined")


class Prediction(Base):
    """Pronostic d'un utilisateur sur un match (vainqueur + score exact)."""

    __tablename__ = "predictions"
    __table_args__ = (UniqueConstraint("user_id", "match_id", name="uq_prediction"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    # Référence par chaîne (pas de FK vers le catalog : frontière des données)
    match_id: Mapped[str] = mapped_column(String(128), index=True)
    # "a" | "b"
    pick: Mapped[str] = mapped_column(String(1))
    score_a: Mapped[int] = mapped_column(Integer)
    score_b: Mapped[int] = mapped_column(Integer)
    # Renseignés par la tâche de scoring quand le match passe à done
    scored: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    points: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
