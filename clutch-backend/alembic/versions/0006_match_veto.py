"""Veto des cartes sur les matchs (extradata.mapveto Liquipedia).

Revision ID: 0006_match_veto
Revises: 0005_streams_and_roster
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006_match_veto"
down_revision: Union[str, None] = "0005_streams_and_roster"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("matches", sa.Column("veto", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("matches", "veto")
