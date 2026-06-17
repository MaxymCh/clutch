"""Ajout de result_a / result_b sur la table matches pour gérer les FF/DQ.

Revision ID: 0010_match_ff
Revises: 0009_merge_heads
Create Date: 2026-06-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010_match_ff"
down_revision: Union[str, Sequence[str], None] = "0009_merge_heads"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("matches", sa.Column("result_a", sa.String(4), nullable=True))
    op.add_column("matches", sa.Column("result_b", sa.String(4), nullable=True))


def downgrade() -> None:
    op.drop_column("matches", "result_b")
    op.drop_column("matches", "result_a")
