"""Feedback dataset model.

Collects field-level ground-truth pairs (OCR value vs. human-corrected value)
for future model improvement. Rows are retained indefinitely for dataset
building; nothing in this table triggers automatic retraining. The application
foreign key uses ``SET NULL`` so training data is preserved even when the source
application is removed.
"""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base

if TYPE_CHECKING:
    from app.database.models.application import Application


class FeedbackEntry(Base):
    """A field-level OCR-versus-human sample for future training.

    Attributes:
        id: Auto-incrementing primary key.
        application_id: Source application (``SET NULL`` on delete).
        field_name: Name of the field the sample describes.
        ocr_value: Value extracted by the OCR pipeline.
        human_value: Value confirmed/corrected by a human reviewer.
        confidence_score: Confidence the OCR pipeline assigned (0.0 - 1.0).
        recorded_at: When the sample was recorded (UTC).
    """

    __tablename__ = "feedback_dataset"
    __table_args__ = (Index("ix_feedback_dataset_application_id", "application_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    application_id: Mapped[int | None] = mapped_column(
        ForeignKey("applications.id", ondelete="SET NULL"),
        nullable=True,
    )
    field_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ocr_value: Mapped[str | None] = mapped_column(Text)
    human_value: Mapped[str] = mapped_column(Text, nullable=False)
    confidence_score: Mapped[float | None] = mapped_column()
    recorded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    application: Mapped[Application | None] = relationship(back_populates="feedback_entries")

    def __repr__(self) -> str:  # pragma: no cover - debugging aid
        return f"<FeedbackEntry id={self.id} field={self.field_name}>"
