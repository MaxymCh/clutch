"""Dépendances communes des endpoints (session DB, utilisateur courant)."""

import uuid

from fastapi import Depends, Request, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security import (
    country_from_accept_language,
    generate_pseudo,
    read_session_user_id,
    write_session_cookie,
)
from app.models.community import User


async def get_current_user(
    request: Request,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> User:
    """Utilisateur courant via cookie de session anonyme.

    Premier appel (pas de cookie valide) → création de l'utilisateur
    (pseudo généré, pays déduit d'Accept-Language, fallback FR) + pose du
    cookie signé. Aucun écran de login : stratégie validée.
    """
    user_id = read_session_user_id(request)
    if user_id:
        user = await session.get(User, user_id)
        if user:
            return user

    name, tag = generate_pseudo()
    user = User(
        id=uuid.uuid4().hex,
        name=name,
        tag=tag,
        country_code=country_from_accept_language(request.headers.get("accept-language")),
        points=0,
        streak=0,
    )
    session.add(user)
    await session.commit()
    write_session_cookie(response, user.id)
    return user
