"""Schéma initial : catalog (ingéré) + community (applicatif).

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-10
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- Catalog (écrit par le worker uniquement) ---
    op.create_table(
        "games",
        sa.Column("id", sa.String(8), primary_key=True),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("short", sa.String(16), nullable=False),
        sa.Column("tag", sa.String(8), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
    )
    op.create_table(
        "teams",
        sa.Column("id", sa.String(64), primary_key=True),
        sa.Column("name", sa.String(128), nullable=False),
        sa.Column("tag", sa.String(16), nullable=False),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("template", sa.String(64), nullable=True),
        sa.Column("wiki", sa.String(32), nullable=True),
        sa.Column("enriched", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "matches",
        sa.Column("id", sa.String(128), primary_key=True),
        sa.Column("game_id", sa.String(8), sa.ForeignKey("games.id"), nullable=False),
        sa.Column("team_a_id", sa.String(64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("team_b_id", sa.String(64), sa.ForeignKey("teams.id"), nullable=False),
        sa.Column("status", sa.String(8), nullable=False),
        sa.Column("phase", sa.String(64), nullable=False),
        sa.Column("best_of", sa.String(3), nullable=False),
        sa.Column("start_time_utc", sa.DateTime(timezone=True), nullable=False),
        sa.Column("score_a", sa.Integer(), nullable=True),
        sa.Column("score_b", sa.Integer(), nullable=True),
        sa.Column("maps", sa.JSON(), nullable=True),
        sa.Column("current_map_label", sa.String(64), nullable=True),
        sa.Column("viewers", sa.String(16), nullable=True),
        sa.Column("extradata", sa.JSON(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_matches_game_id", "matches", ["game_id"])
    op.create_index("ix_matches_team_a_id", "matches", ["team_a_id"])
    op.create_index("ix_matches_team_b_id", "matches", ["team_b_id"])
    op.create_index("ix_matches_status", "matches", ["status"])
    op.create_index("ix_matches_start_time_utc", "matches", ["start_time_utc"])

    # --- Community (jamais touché par le worker) ---
    op.create_table(
        "users",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("tag", sa.String(8), nullable=False),
        sa.Column("country_code", sa.String(2), nullable=False),
        sa.Column("points", sa.Integer(), nullable=False),
        sa.Column("streak", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_table(
        "groups",
        sa.Column("id", sa.String(32), primary_key=True),
        sa.Column("name", sa.String(64), nullable=False),
        sa.Column("emoji", sa.String(8), nullable=False),
        sa.Column("code", sa.String(16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_groups_code", "groups", ["code"], unique=True)
    op.create_table(
        "group_memberships",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("group_id", sa.String(32), sa.ForeignKey("groups.id"), nullable=False),
        sa.Column("user_id", sa.String(32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("group_id", "user_id", name="uq_membership"),
    )
    op.create_index("ix_group_memberships_group_id", "group_memberships", ["group_id"])
    op.create_index("ix_group_memberships_user_id", "group_memberships", ["user_id"])
    op.create_table(
        "predictions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.String(32), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("match_id", sa.String(128), nullable=False),
        sa.Column("pick", sa.String(1), nullable=False),
        sa.Column("score_a", sa.Integer(), nullable=False),
        sa.Column("score_b", sa.Integer(), nullable=False),
        sa.Column("scored", sa.Boolean(), nullable=False),
        sa.Column("points", sa.Integer(), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint("user_id", "match_id", name="uq_prediction"),
    )
    op.create_index("ix_predictions_user_id", "predictions", ["user_id"])
    op.create_index("ix_predictions_match_id", "predictions", ["match_id"])
    op.create_index("ix_predictions_scored", "predictions", ["scored"])


def downgrade() -> None:
    op.drop_table("predictions")
    op.drop_table("group_memberships")
    op.drop_table("groups")
    op.drop_table("users")
    op.drop_table("matches")
    op.drop_table("teams")
    op.drop_table("games")
