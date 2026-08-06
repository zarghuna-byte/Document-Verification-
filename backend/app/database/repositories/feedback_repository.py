"""Repository for the FeedbackEntry entity."""

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database.models.feedback_dataset import FeedbackEntry
from app.database.repositories.base import BaseRepository


class FeedbackRepository(BaseRepository[FeedbackEntry]):
    """Persistence operations for :class:`FeedbackEntry`.

    Args:
        db: SQLAlchemy session used for all database interaction.
    """

    def __init__(self, db: Session) -> None:
        super().__init__(db)

    @property
    def _model(self) -> type[FeedbackEntry]:
        return FeedbackEntry

    def create(
        self,
        *,
        application_id: int | None,
        field_name: str,
        human_value: str,
        ocr_value: str | None = None,
        confidence_score: float | None = None,
    ) -> FeedbackEntry:
        """Create and persist a new feedback dataset sample.

        Args:
            application_id: Source application, if known.
            field_name: Name of the field the sample describes.
            human_value: Value confirmed/corrected by a human reviewer.
            ocr_value: Value extracted by the OCR pipeline, if available.
            confidence_score: Confidence the OCR pipeline assigned.

        Returns:
            The persisted feedback entry.
        """
        entry = FeedbackEntry(
            application_id=application_id,
            field_name=field_name,
            human_value=human_value,
            ocr_value=ocr_value,
            confidence_score=confidence_score,
        )
        self._db.add(entry)
        return self._commit_and_refresh(entry)

    def list(
        self,
        *,
        offset: int = 0,
        limit: int = 50,
    ) -> Sequence[FeedbackEntry]:
        """Return feedback samples, most recently recorded first.

        Args:
            offset: Number of rows to skip.
            limit: Maximum number of rows to return.

        Returns:
            A sequence of feedback entries.
        """
        statement = (
            select(FeedbackEntry)
            .order_by(FeedbackEntry.recorded_at.desc(), FeedbackEntry.id.desc())
            .offset(offset)
            .limit(limit)
        )
        return self._db.scalars(statement).all()
