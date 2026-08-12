"""Pydantic schemas for the completeness module.

These models shape the structured completeness report returned by both the
``GET`` and ``POST`` completeness endpoints. Uploaded documents reuse the upload
module's public metadata model so the same read model serves both modules.
"""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.completeness.constants import (
    CompletenessStatus,
    DocumentCompletenessStatus,
)
from app.database.models.enums import DocumentType
from app.upload.schemas import DocumentMetadata


class DocumentSlot(BaseModel):
    """One required upload slot within a document topic.

    Attributes:
        copy_number: 1-based index of the slot within the topic.
        label: Employee-facing slot name (e.g. "Copy 3", "Front", "Back").
        document_type: Backend document type expected in this slot.
        is_present: Whether a matching upload exists.
        document_id: Id of the upload filling the slot, when present.
        filename: Original filename of the upload filling the slot, when present.
    """

    copy_number: int = Field(ge=1)
    label: str
    document_type: DocumentType
    is_present: bool
    document_id: int | None = None
    filename: str | None = None


class RequiredDocumentStatus(BaseModel):
    """Completeness of a single required document topic.

    Attributes:
        key: Catalogue identifier for the topic (``AUTHORITY_LETTER``, ...,
            ``CNIC``).
        document_type: Primary backend document type of the topic.
        label: Employee-facing display name of the topic.
        required_copies: Number of uploads the topic requires.
        uploaded_copies: Number of uploads currently present for the topic.
        is_present: Whether at least one copy has been uploaded.
        is_complete: Whether every required copy is present.
        status: Per-topic completeness (``COMPLETE``, ``PARTIAL``, ``MISSING``).
        slots: Per-slot presence for every required copy.
    """

    key: str
    document_type: DocumentType
    label: str
    required_copies: int = Field(ge=1)
    uploaded_copies: int = Field(ge=0)
    is_present: bool
    is_complete: bool
    status: DocumentCompletenessStatus
    slots: list[DocumentSlot] = Field(default_factory=list)


class MissingSlotInfo(BaseModel):
    """A required upload slot that has not been filled yet."""

    key: str
    label: str
    slot_number: int = Field(ge=1)
    slot_label: str
    document_type: DocumentType


class DuplicateDocumentInfo(BaseModel):
    """A document topic that holds more uploads than it requires."""

    key: str
    document_type: DocumentType
    copy_count: int = Field(ge=1, description="Number of uploads of this topic.")


class UnexpectedDocumentInfo(BaseModel):
    """A document type outside the configured required catalogue."""

    document_type: DocumentType
    copy_count: int = Field(ge=1, description="Number of copies of this type.")


class ErrorResponse(BaseModel):
    """Envelope used for every completeness error response."""

    detail: str = Field(examples=["Application not found"])


class CompletenessReport(BaseModel):
    """Structured result of a completeness check.

    Attributes:
        application_id: Id of the checked application.
        status: Overall completeness status (``COMPLETE`` or ``INCOMPLETE``).
        uploaded_documents: Metadata of every document uploaded for the
            application.
        required_documents: Per-topic completeness with per-slot presence.
        missing_documents: Every unfilled required slot, in catalogue order.
        duplicate_documents: Topics holding more uploads than they require.
        unexpected_documents: Types outside the configured catalogue.
        uploaded_copies: Number of required uploads present.
        total_copies: Number of required uploads in total.
        completion_percentage: Percentage of required uploads present (0-100).
        timestamp: When the check was run (UTC).
    """

    model_config = ConfigDict(from_attributes=True)

    application_id: int
    status: CompletenessStatus
    uploaded_documents: list[DocumentMetadata]
    required_documents: list[RequiredDocumentStatus]
    missing_documents: list[MissingSlotInfo]
    duplicate_documents: list[DuplicateDocumentInfo]
    unexpected_documents: list[UnexpectedDocumentInfo]
    uploaded_copies: int = Field(ge=0)
    total_copies: int = Field(ge=1)
    completion_percentage: float = Field(ge=0.0, le=100.0)
    timestamp: datetime
