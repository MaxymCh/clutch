"""Augmente la longueur de players.role à VARCHAR(64).

Revision ID: 0007_player_role_length
Revises: 0006_players
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0007_player_role_length"
down_revision: Union[str, None] = "0006_players"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.alter_column("players", "role", type_=sa.String(64), existing_nullable=True)


def downgrade() -> None:
    op.alter_column("players", "role", type_=sa.String(32), existing_nullable=True)
