"""HTTP endpoints for the audit activity module.

Exposes the global (``GET /activity``) and per-application
(``GET /applications/{id}/activity``) recent-activity endpoints. Routes stay
thin: they build the service per request and translate the module's domain
exceptions into documented HTTP errors.
"""

import logging
from functools import wraps
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.audit.exceptions import AuditError
from app.audit.schemas import ActivityListResponse, ErrorResponse
from app.audit.services import ActivityService, MAX_LIMIT
from app.database.connection import get_db

logger = logging.getLogger(__name__)

router = APIRouter(tags=["activity"])

_GET_DB = Annotated[Session, Depends(get_db)]

#: Shared OpenAPI error-response documentation reused by both endpoints.
_ERROR_RESPONSES = {
    404: {"model": ErrorResponse, "description": "Application not found."},
    500: {"model": ErrorResponse, "description": "Unexpected activity lookup failure."},
}


def _handle_audit_errors(func):
    """Translate :class:`AuditError` into HTTP error responses."""

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except AuditError as exc:
            logger.error(
                "Audit error %s: %s",
                exc.__class__.__name__,
                exc.detail,
            )
            raise HTTPException(status_code=exc.status_code, detail=exc.detail) from exc

    return wrapper


def _service(db: Session) -> ActivityService:
    """Build the activity service bound to the request session."""
    return ActivityService(db)


@router.get(
    "/activity",
    response_model=ActivityListResponse,
    summary="List recent activity",
    description=(
        "Returns the most recent audit events across all applications for the "
        "dashboard activity feed, newest first."
    ),
    responses=_ERROR_RESPONSES,
)
@_handle_audit_errors
def list_activity(
    db: _GET_DB,
    limit: int = Query(default=25, ge=1, le=MAX_LIMIT),
) -> ActivityListResponse:
    """Return the global recent-activity feed.

    Args:
        db: Active database session.
        limit: Maximum number of events to return.

    Returns:
        The recent activity slice.
    """
    return _service(db).list_recent(limit=limit)


@router.get(
    "/applications/{application_id}/activity",
    response_model=ActivityListResponse,
    summary="List recent activity for an application",
    description=(
        "Returns the most recent audit events recorded for one application, "
        "newest first."
    ),
    responses=_ERROR_RESPONSES,
)
@_handle_audit_errors
def list_application_activity(
    application_id: int,
    db: _GET_DB,
    limit: int = Query(default=25, ge=1, le=MAX_LIMIT),
) -> ActivityListResponse:
    """Return the recent activity feed for one application.

    Args:
        application_id: Id of the application.
        db: Active database session.
        limit: Maximum number of events to return.

    Returns:
        The recent activity slice scoped to the application.

    Raises:
        HTTPException: When the application does not exist.
    """
    return _service(db).list_recent(application_id=application_id, limit=limit)
