"""Base déclarative commune à tous les modèles ORM."""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base SQLAlchemy 2.0 (style Mapped/mapped_column)."""
