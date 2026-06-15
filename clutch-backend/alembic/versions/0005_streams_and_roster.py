"""Streams sur les matchs + roster joueurs des équipes.

- `matches.streams` : liens de diffusion [{platform, url}] (streamurls LPDB).
- `teams.roster_loaded` : drapeau d'ingestion du roster (gestion du quota).
- table `players` : joueurs ingérés depuis Liquipedia /squadplayer.

Revision ID: 0005_streams_and_roster
Revises: 0004_team_logo_url
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005_streams_and_roster"
down_revision: Union[str, None] = "0004_team_logo_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("matches", sa.Column("streams", sa.JSON(), nullable=True))
    op.add_column(
        "teams",
        sa.Column("roster_loaded", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.create_table(
        "players",
        sa.Column("id", sa.String(192), primary_key=True),
        sa.Column("team_id", sa.String(64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("role", sa.String(48), nullable=True),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_players_team_id", "players", ["team_id"])


def downgrade() -> None:
    op.drop_index("ix_players_team_id", table_name="players")
    op.drop_table("players")
    op.drop_column("teams", "roster_loaded")
    op.drop_column("matches", "streams")
