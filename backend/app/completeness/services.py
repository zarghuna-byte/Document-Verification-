"""Completeness verification service.

Verifies that an application's uploaded document metadata satisfies the
configured required-document catalogue. The service is stateless: every call
reads the current document rows from the database and produces a fresh report,
so reports can never go stale relative to the source of truth.
"""

import logging
from collections import Counter
from collections.abc import Iterable
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.completeness.constants import (
    ALL_CONFIGURED_DOCUMENT_TYPES,
    REQUIRED_DOCUMENTS,
    TOTAL_REQUIRED_COPIES,
    CompletenessStatus,
    DocumentCompletenessStatus,
    RequiredDocument,
)
from app.completeness.exceptions import ApplicationNotFound
from app.completeness.schemas import (
    CompletenessReport,
    DocumentSlot,
    DuplicateDocumentInfo,
    MissingSlotInfo,
    RequiredDocumentStatus,
    UnexpectedDocumentInfo,
)
from app.completeness.validators import validate_document_configuration
from app.database.models.application import Application
from app.database.models.document import Document
from app.database.models.enums import DocumentType
from app.database.repositories.application_repository import ApplicationRepository
from app.database.repositories.document_repository import DocumentRepository
from app.upload.schemas import DocumentMetadata

logger = logging.getLogger(__name__)


class CompletenessService:
    """Verifies an application's document set against the configured catalogue.

    Args:
        db: SQLAlchemy session used for all database interaction.
    """

    def __init__(self, db: Session) -> None:
        validate_document_configuration()
        self._db = db
        self._applications = ApplicationRepository(db)
        self._documents = DocumentRepository(db)

    def verify(self, *, application_id: int) -> CompletenessReport:
        """Run completeness verification and return a fresh report.

        Args:
            application_id: Id of the application to verify.

        Returns:
            A freshly computed completeness report.

        Raises:
            ApplicationNotFound: When the application does not exist.
        """
        application = self._get_application(application_id)
        logger.info(
            "Completeness verification started for application id=%s",
            application_id,
        )
        try:
            report = self._build_report(application)
        except Exception:
            logger.exception(
                "Completeness verification failed for application id=%s",
                application_id,
            )
            raise

        self._log_detections(report)
        logger.info(
            "Completeness verification completed for application id=%s: %s",
            application_id,
            report.status.value,
        )
        return report

    def get_report(self, *, application_id: int) -> CompletenessReport:
        """Return the current completeness report.

        The module is stateless, so the report is always recomputed from live
        document metadata and is identical to a fresh verification.

        Args:
            application_id: Id of the application.

        Returns:
            A freshly computed completeness report.

        Raises:
            ApplicationNotFound: When the application does not exist.
        """
        return self.verify(application_id=application_id)

    def _get_application(self, application_id: int) -> Application:
        """Return the application or raise ``ApplicationNotFound``."""
        application = self._applications.get_by_id(application_id)
        if application is None:
            raise ApplicationNotFound()
        return application

    def _load_documents(self, application_id: int) -> list[Document]:
        """Load every document uploaded for an application."""
        return list(self._documents.get_all_by_application(application_id))

    def _build_report(self, application: Application) -> CompletenessReport:
        """Assemble the report from the application's document metadata."""
        documents = self._load_documents(application.id)
        counts = Counter(document.document_type for document in documents)

        required_statuses = [
            self._build_topic_status(topic, documents) for topic in REQUIRED_DOCUMENTS
        ]
        missing = [
            MissingSlotInfo(
                key=topic.key,
                label=topic.label,
                slot_number=slot.copy_number,
                slot_label=slot.label,
                document_type=slot.document_type,
            )
            for topic in required_statuses
            for slot in topic.slots
            if not slot.is_present
        ]
        duplicates = [
            DuplicateDocumentInfo(
                key=topic.key,
                document_type=topic.document_type,
                copy_count=_raw_count(documents, topic),
            )
            for topic in REQUIRED_DOCUMENTS
            if _raw_count(documents, topic) > topic.required_copies
        ]
        unexpected = [
            UnexpectedDocumentInfo(
                document_type=document_type,
                copy_count=counts[document_type],
            )
            for document_type in _sorted_values(counts)
            if document_type not in ALL_CONFIGURED_DOCUMENT_TYPES
        ]

        uploaded_copies = sum(topic.uploaded_copies for topic in required_statuses)
        completion_percentage = round(
            100.0 * uploaded_copies / TOTAL_REQUIRED_COPIES,
            2,
        )

        return CompletenessReport(
            application_id=application.id,
            status=self._determine_status(missing),
            uploaded_documents=[DocumentMetadata.model_validate(document) for document in documents],
            required_documents=required_statuses,
            missing_documents=missing,
            duplicate_documents=duplicates,
            unexpected_documents=unexpected,
            uploaded_copies=uploaded_copies,
            total_copies=TOTAL_REQUIRED_COPIES,
            completion_percentage=completion_percentage,
            timestamp=datetime.now(timezone.utc),
        )

    def _build_topic_status(
        self,
        topic: RequiredDocument,
        documents: list[Document],
    ) -> RequiredDocumentStatus:
        """Build per-topic status with per-slot presence for one catalogue entry."""
        slot_types = topic.types()
        topic_documents = [
            document
            for document in documents
            if document.document_type in slot_types
        ]
        slots = self._build_slots(topic, topic_documents)

        present = sum(1 for slot in slots if slot.is_present)
        is_complete = present == topic.required_copies
        if is_complete:
            status = DocumentCompletenessStatus.COMPLETE
        elif present > 0:
            status = DocumentCompletenessStatus.PARTIAL
        else:
            status = DocumentCompletenessStatus.MISSING

        return RequiredDocumentStatus(
            key=topic.key,
            document_type=topic.document_type,
            label=topic.label,
            required_copies=topic.required_copies,
            uploaded_copies=present,
            is_present=present > 0,
            is_complete=is_complete,
            status=status,
            slots=slots,
        )

    def _build_slots(
        self,
        topic: RequiredDocument,
        topic_documents: list[Document],
    ) -> list[DocumentSlot]:
        """Resolve presence for every required slot of a topic.

        Composite topics (e.g. CNIC) match each slot against its own backend
        document type. Single-type topics match by ``copy_number``; when every
        uploaded copy carries the default copy number (legacy rows), the first
        ``uploaded`` slots are treated as present so existing uploads stay
        recognised.
        """
        slot_types = topic.types()
        by_copy = {document.copy_number: document for document in topic_documents}
        uses_numbering = any(
            document.copy_number != 1 for document in topic_documents
        )

        slots: list[DocumentSlot] = []
        for index in range(topic.required_copies):
            slot_number = index + 1
            if topic.slot_types:
                document_type = slot_types[index]
                label = (
                    topic.slot_labels[index]
                    if index < len(topic.slot_labels)
                    else f"Copy {slot_number}"
                )
                document = next(
                    (
                        item
                        for item in topic_documents
                        if item.document_type == document_type
                    ),
                    None,
                )
            else:
                document_type = topic.document_type
                label = f"Copy {slot_number}"
                document = by_copy.get(slot_number)
                if (
                    document is None
                    and not uses_numbering
                    and len(topic_documents) >= slot_number
                ):
                    document = topic_documents[slot_number - 1]

            slots.append(
                DocumentSlot(
                    copy_number=slot_number,
                    label=label,
                    document_type=document_type,
                    is_present=document is not None,
                    document_id=document.id if document else None,
                    filename=document.original_filename if document else None,
                )
            )
        return slots

    def _determine_status(
        self,
        missing: list[MissingSlotInfo],
    ) -> CompletenessStatus:
        """Resolve the overall status: complete only when nothing is missing."""
        return CompletenessStatus.INCOMPLETE if missing else CompletenessStatus.COMPLETE

    def _log_detections(self, report: CompletenessReport) -> None:
        """Log every detected anomaly in the report."""
        for slot in report.missing_documents:
            logger.info(
                "Missing slot for application id=%s: %s %s",
                report.application_id,
                slot.label,
                slot.slot_label,
            )
        for duplicate in report.duplicate_documents:
            logger.warning(
                "Duplicate document detected for application id=%s: %s (%s copies)",
                report.application_id,
                duplicate.key,
                duplicate.copy_count,
            )
        for unexpected in report.unexpected_documents:
            logger.warning(
                "Unexpected document detected for application id=%s: %s (%s copies)",
                report.application_id,
                unexpected.document_type.value,
                unexpected.copy_count,
            )


def _sorted_values(document_types: Iterable[DocumentType]) -> list[DocumentType]:
    """Return document types ordered by their enum value for stable output."""
    return sorted(document_types, key=lambda document_type: document_type.value)


def _raw_count(documents: list[Document], topic: RequiredDocument) -> int:
    """Return the number of uploaded documents belonging to a topic."""
    return sum(1 for document in documents if document.document_type in topic.types())
