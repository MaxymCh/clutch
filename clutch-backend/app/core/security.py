"""Session anonyme par cookie httpOnly signé (stratégie validée).

Pas d'écran de login côté front : le premier appel authentifié crée un
utilisateur et pose le cookie. Le front devra envoyer `credentials: 'include'`
au branchement (front et back sur des origines différentes).
"""

import secrets

from fastapi import Request, Response
from itsdangerous import BadSignature, URLSafeSerializer

from app.core.config import get_settings

COOKIE_NAME = "clutch_session"
# Durée de vie large : couvre tout le tournoi (180 jours).
COOKIE_MAX_AGE = 180 * 24 * 3600

_serializer = URLSafeSerializer(get_settings().session_secret, salt="clutch.session")


def read_session_user_id(request: Request) -> str | None:
    """Extrait l'id utilisateur du cookie signé, ou None si absent/invalide."""
    raw = request.cookies.get(COOKIE_NAME)
    if not raw:
        return None
    try:
        value = _serializer.loads(raw)
    except BadSignature:
        return None
    return value if isinstance(value, str) else None


def write_session_cookie(response: Response, user_id: str) -> None:
    """Pose le cookie de session signé.

    SameSite=None + Secure quand COOKIE_SECURE=true (origines front/back
    différentes en prod, HTTPS requis) ; Lax en dev local HTTP.
    """
    secure = get_settings().cookie_secure
    response.set_cookie(
        key=COOKIE_NAME,
        value=_serializer.dumps(user_id),
        max_age=COOKIE_MAX_AGE,
        httponly=True,
        secure=secure,
        samesite="none" if secure else "lax",
        path="/",
    )


def generate_pseudo() -> tuple[str, str]:
    """Génère un pseudo lisible (`clutcher_8421`) et son tag d'avatar.

    Le tag suit la convention du front (initiales en majuscules, 2 lettres).
    """
    number = secrets.randbelow(10_000)
    name = f"clutcher_{number:04d}"
    return name, "CL"


def country_from_accept_language(header: str | None) -> str:
    """Déduit un code pays ISO alpha-2 depuis Accept-Language, fallback FR.

    Exemples : "fr-FR,fr;q=0.9" → FR ; "en-US,en" → US ; "fr" → FR (fallback).
    """
    if not header:
        return "FR"
    for part in header.split(","):
        locale = part.split(";")[0].strip()
        pieces = locale.replace("_", "-").split("-")
        if len(pieces) >= 2 and len(pieces[1]) == 2 and pieces[1].isalpha():
            return pieces[1].upper()
    return "FR"
