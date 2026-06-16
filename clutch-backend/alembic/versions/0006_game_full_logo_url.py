"""Ajout de full_logo_url sur la table games (logo horizontal EWC).

Revision ID: 0006_game_full_logo_url
Revises: 0005_game_logo_url
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0006_game_full_logo_url"
down_revision: Union[str, None] = "0005_game_logo_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("games", sa.Column("full_logo_url", sa.String(256), nullable=True))


def downgrade() -> None:
    op.drop_column("games", "full_logo_url")
