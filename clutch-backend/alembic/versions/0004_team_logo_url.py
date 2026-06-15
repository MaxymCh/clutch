"""Ajout de logo_url sur la table teams (URL du logo Liquipedia).

Revision ID: 0004_team_logo_url
Revises: 0003_game_bg_url
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_team_logo_url"
down_revision: Union[str, None] = "0003_game_bg_url"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("teams", sa.Column("logo_url", sa.String(512), nullable=True))


def downgrade() -> None:
    op.drop_column("teams", "logo_url")
