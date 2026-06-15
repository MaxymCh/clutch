"""Merge des deux branches issues de 0004 (group_scope + streams/roster/veto).

Deux migrations ont été créées en parallèle à partir de 0004_team_logo_url :
- 0005_group_scope (portée des groupes)
- 0005_streams_and_roster → 0006_match_veto (streams, roster, veto)

Cette révision ne fait que réunir les deux heads (aucun changement de schéma).

Revision ID: 0007_merge_heads
Revises: 0005_group_scope, 0006_match_veto
Create Date: 2026-06-15
"""

from typing import Sequence, Union

revision: str = "0007_merge_heads"
down_revision: Union[str, Sequence[str], None] = ("0005_group_scope", "0006_match_veto")
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
