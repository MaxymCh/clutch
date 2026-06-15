"""Périmètre optionnel des groupes (jeu ou équipe).

Revision ID: 0004_group_scope
Revises: 0003_game_bg_url
Create Date: 2026-06-15
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_group_scope"
down_revision: Union[str, None] = "0003_game_bg_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("groups", sa.Column("game_id", sa.String(8), nullable=True))
    op.add_column("groups", sa.Column("team_id", sa.String(64), nullable=True))


def downgrade() -> None:
    op.drop_column("groups", "team_id")
    op.drop_column("groups", "game_id")
