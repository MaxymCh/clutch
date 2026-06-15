"""Widen groups.game_id to VARCHAR(256) for comma-separated game IDs.

Revision ID: 0008_widen_group_game_ids
Revises: 0007_merge_heads
Create Date: 2026-06-15
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0008_widen_group_game_ids"
down_revision: Union[str, None] = "0007_merge_heads"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column(
        "groups",
        "game_id",
        existing_type=sa.String(8),
        type_=sa.String(256),
        existing_nullable=True,
    )
    op.drop_column("groups", "team_id")


def downgrade() -> None:
    op.add_column("groups", sa.Column("team_id", sa.String(64), nullable=True))
    op.alter_column(
        "groups",
        "game_id",
        existing_type=sa.String(256),
        type_=sa.String(8),
        existing_nullable=True,
    )
