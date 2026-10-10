import hashlib

from fastapi import Depends, HTTPException, Request
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.auth import Identity, verify_token


def provider_budget(request: Request, identity: Identity = Depends(verify_token)) -> None:
    """Small, shared hourly limits for endpoints that can incur provider charges."""
    engine = request.app.state.engine
    if engine is None:
        raise HTTPException(503, "Database is not configured")
    path = request.url.path
    category, maximum = (
        ("ticket", 20)
        if path == "/tickets/extract"
        else ("audio", 30)
        if path == "/audio/transcribe"
        else ("match", 30)
        if path.endswith("/match")
        else ("location", 100)
    )
    subject = hashlib.sha256(identity.subject.encode()).hexdigest()
    try:
        with engine.begin() as connection:
            count = connection.scalar(
                text("""
            INSERT INTO provider_usage(subject_hash,category,window_at,requests)
            VALUES (:subject,:category,date_trunc('hour',CURRENT_TIMESTAMP),1)
            ON CONFLICT(subject_hash,category,window_at)
            DO UPDATE SET requests=provider_usage.requests+1
            RETURNING requests
        """),
                {"subject": subject, "category": category},
            )
    except SQLAlchemyError as error:
        raise HTTPException(503, "Request limits temporarily unavailable; retry later") from error
    if count > maximum:
        raise HTTPException(
            429, "Hourly request limit reached; try again later", headers={"Retry-After": "3600"}
        )
