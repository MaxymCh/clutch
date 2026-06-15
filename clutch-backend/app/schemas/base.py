"""Socle des schémas Pydantic — contrat API = types TS du front.

Interne en snake_case, JSON en camelCase via alias (règle CLAUDE.md).
Les champs optionnels absents ne doivent PAS sortir en null : les routes
utilisent `response_model_exclude_none=True`.
"""

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class ApiModel(BaseModel):
    """Base commune : alias camelCase + construction depuis l'ORM."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
