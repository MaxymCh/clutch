"""Création de la table players (roster des équipes EWC).

Revision ID: 0006_players
Revises: 0005_game_logo_url
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006_players"
down_revision: Union[str, None] = "0005_game_logo_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "players",
        sa.Column("id", sa.String(128), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("country_code", sa.String(2), nullable=False, server_default="XX"),
        sa.Column("role", sa.String(32), nullable=True),
        sa.Column("team_id", sa.String(64), sa.ForeignKey("teams.id"), nullable=True, index=True),
        sa.Column("logo_url", sa.String(512), nullable=True),
        sa.Column("wiki", sa.String(32), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("players")
