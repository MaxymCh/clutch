"""Ajout de bg_url sur la table games (image de fond des cartes jeu).

Revision ID: 0003_game_bg_url
Revises: 0002_user_preferences
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_game_bg_url"
down_revision: Union[str, None] = "0002_user_preferences"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("games", sa.Column("bg_url", sa.String(256), nullable=False, server_default=""))


def downgrade() -> None:
    op.drop_column("games", "bg_url")
