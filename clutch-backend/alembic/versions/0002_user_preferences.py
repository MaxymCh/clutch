"""Table user_preferences (1:1 avec users) — thème, notifs, onboarding, favoris.

Revision ID: 0002_user_preferences
Revises: 0001_initial
Create Date: 2026-06-15
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_user_preferences"
down_revision: Union[str, None] = "0001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "user_preferences",
        sa.Column("user_id", sa.String(32), sa.ForeignKey("users.id"), primary_key=True),
        sa.Column("theme", sa.String(8), nullable=False, server_default="light"),
        sa.Column("notifications", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("onboarded", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("fav_teams", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("fav_games", sa.JSON(), nullable=False, server_default="[]"),
    )


def downgrade() -> None:
    op.drop_table("user_preferences")
