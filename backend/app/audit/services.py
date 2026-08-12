"""Audit activity service.

Reads recent entries from the append-only audit log for the global dashboard
feed and the per-application activity feed. The service is stateless and always
returns the current rows, most recent first.
"""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.exceptions import ApplicationNotFound
from app.audit.schemas import ActivityEvent, ActivityListResponse
from app.database.models.audit_log import AuditLog
from app.database.repositories.application_repository import ApplicationRepository

#: Upper bound for a single activity slice.
MAX_LIMIT = 50


class ActivityService:
    """Reads recent audit activity from the database.

    Args:
        db: SQLAlchemy session used for all database interaction.
    """

    def __init__(self, db: Session) -> None:
        self._db = db
        self._applications = ApplicationRepository(db)

    def list_recent(
        self,
        *,
        application_id: int | None = None,
        limit: int = 25,
    ) -> ActivityListResponse:
        """Return the most recent audit events, newest first.

        Args:
            application_id: When set, only events for this application are
                returned.
            limit: Maximum number of events to return (clamped to
                :data:`MAX_LIMIT`).

        Returns:
            The recent activity slice.

        Raises:
            ApplicationNotFound: When ``application_id`` references an
                application that does not exist.
        """
        bound_limit = max(1, min(limit, MAX_LIMIT))

        if application_id is not None:
            if self._applications.get_by_id(application_id) is None:
                raise ApplicationNotFound()

        statement = (
            select(AuditLog)
            .order_by(AuditLog.performed_at.desc(), AuditLog.id.desc())
            .limit(bound_limit)
        )
        if application_id is not None:
            statement = statement.where(AuditLog.application_id == application_id)

        events = [ActivityEvent.model_validate(event) for event in self._db.scalars(statement).all()]
        return ActivityListResponse(
            application_id=application_id,
            total=len(events),
            events=events,
        )
