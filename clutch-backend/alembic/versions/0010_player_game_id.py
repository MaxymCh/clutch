"""Rattache chaque joueur à un jeu (effectif par jeu).

- `players.game_id` : gameId de l'effectif (val, lol, cs2…), nullable car les
  anciens enregistrements ingérés sont renseignés à la prochaine ingestion.

Revision ID: 0010_player_game_id
Revises: 0009_merge_heads
Create Date: 2026-06-17
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0010_player_game_id"
down_revision: Union[str, None] = "0009_merge_heads"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("players", sa.Column("game_id", sa.String(8), nullable=True))
    op.create_foreign_key(
        "fk_players_game_id", "players", "games", ["game_id"], ["id"]
    )
    op.create_index("ix_players_game_id", "players", ["game_id"])


def downgrade() -> None:
    op.drop_index("ix_players_game_id", table_name="players")
    op.drop_constraint("fk_players_game_id", "players", type_="foreignkey")
    op.drop_column("players", "game_id")
