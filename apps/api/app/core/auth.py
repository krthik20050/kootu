from dataclasses import dataclass
from urllib.error import URLError

import jwt
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import InvalidTokenError, PyJWKClient, PyJWKClientError
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_session
from app.models.domain import Profile

bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class Identity:
    subject: str


def verify_token(
    request: Request, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)
) -> Identity:
    if credentials is None:
        raise HTTPException(401, "Sign in to continue", headers={"WWW-Authenticate": "Bearer"})
    settings = request.app.state.settings
    if not settings.clerk_issuer:
        raise HTTPException(503, "Authentication is not configured")
    client: PyJWKClient = request.app.state.jwks_client
    try:
        key = client.get_signing_key_from_jwt(credentials.credentials)
        claims = jwt.decode(
            credentials.credentials,
            key.key,
            algorithms=["RS256"],
            issuer=settings.clerk_issuer,
            audience=settings.clerk_audience or None,
            options={
                "require": ["exp", "iat", "nbf", "iss", "sub", "azp"],
                "verify_aud": bool(settings.clerk_audience),
            },
            leeway=5,
        )
        if (
            claims.get("azp") != settings.frontend_url
            or not isinstance(claims["sub"], str)
            or not claims["sub"]
        ):
            raise InvalidTokenError("Invalid party or subject")
        return Identity(subject=claims["sub"])
    except (InvalidTokenError, PyJWKClientError, URLError, OSError) as error:
        raise HTTPException(
            401, "Session is invalid or expired", headers={"WWW-Authenticate": "Bearer"}
        ) from error


def current_profile(
    request: Request,
    identity: Identity = Depends(verify_token),
    session: Session = Depends(get_session, scope="function"),
) -> Profile:
    profile = session.scalar(select(Profile).where(Profile.clerk_subject == identity.subject))
    if profile is None:
        profile = Profile(clerk_subject=identity.subject, role="PASSENGER")
        try:
            with session.begin_nested():
                session.add(profile)
                session.flush()
        except IntegrityError:
            profile = session.scalar(
                select(Profile).where(Profile.clerk_subject == identity.subject)
            )
            if profile is None:
                raise HTTPException(409, "Profile creation raced; retry") from None
    if identity.subject == request.app.state.settings.bootstrap_admin_subject:
        profile.role = "ADMIN"
    return profile


def admin(profile: Profile = Depends(current_profile)) -> Profile:
    if profile.role != "ADMIN":
        raise HTTPException(403, "Administrator access required")
    return profile
