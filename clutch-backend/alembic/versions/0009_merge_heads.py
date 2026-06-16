"""Merge des deux heads restantes (branche logos + branche groups/veto).

Après 0007_merge_heads, il subsistait deux heads parallèles :
- 0006_game_full_logo_url (0005_game_logo_url → full_logo_url des jeux)
- 0008_widen_group_game_ids (0007_merge_heads → élargissement game_ids)

Cette révision réunit ces deux heads (aucun changement de schéma) pour que
`alembic upgrade head` retrouve une head unique.

Revision ID: 0009_merge_heads
Revises: 0006_game_full_logo_url, 0008_widen_group_game_ids
Create Date: 2026-06-16
"""

from typing import Sequence, Union

revision: str = "0009_merge_heads"
down_revision: Union[str, Sequence[str], None] = ("0006_game_full_logo_url", "0008_widen_group_game_ids")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
