"""Pydantic schemas for the audit activity module."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ActivityEvent(BaseModel):
    """One recorded system action shown in an activity feed.

    Attributes:
        id: Audit log primary key.
        application_id: Related application, when the action referenced one
            (survives application deletion via ``SET NULL``).
        username: Identity of the user who performed the action.
        action: Machine-readable action identifier.
        performed_at: When the action occurred (UTC).
        details: Structured JSON context describing the action.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int
    application_id: int | None
    username: str
    action: str
    performed_at: datetime
    details: dict[str, Any] | None = None


class ActivityListResponse(BaseModel):
    """A recent slice of the audit log.

    Attributes:
        application_id: The application the slice is scoped to, when filtered.
        total: Number of events returned in this slice.
        events: The events, most recent first.
    """

    application_id: int | None = None
    total: int = Field(ge=0)
    events: list[ActivityEvent] = Field(default_factory=list)


class ErrorResponse(BaseModel):
    """Standard error envelope returned by the module's endpoints."""

    detail: str
