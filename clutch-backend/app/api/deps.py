"""Dépendances communes des endpoints (session DB, utilisateur courant)."""

import secrets

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_session
from app.core.security import verify_supabase_token
from app.models.community import User

_bearer = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    """Utilisateur courant via JWT Supabase (Bearer token).

    Premier appel avec un token valide → création automatique du profil en base.
    Race condition gérée : si deux requêtes parallèles tentent de créer le même
    utilisateur, l'IntegrityError est catchée et on refetch depuis la base.
    """
    user_id = verify_supabase_token(credentials.credentials)
    user = await session.get(User, user_id)
    if not user:
        try:
            number = secrets.randbelow(10_000)
            user = User(
                id=user_id,
                name=f"clutcher_{number:04d}",
                tag="CL",
                country_code="FR",
                points=0,
                streak=0,
            )
            session.add(user)
            await session.commit()
        except IntegrityError:
            await session.rollback()
            user = await session.get(User, user_id)
    return user
