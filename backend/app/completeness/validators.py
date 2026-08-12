"""Configuration validation for the completeness module.

Completeness verification depends on the required-document catalogue being
internally consistent. These validators run once when the service is constructed
so a misconfigured catalogue fails fast instead of producing misleading reports.
"""

from app.completeness.constants import (
    ALL_CONFIGURED_DOCUMENT_TYPES,
    REQUIRED_DOCUMENTS,
)
from app.completeness.exceptions import InvalidDocumentConfiguration
from app.database.models.enums import DocumentType


def validate_document_configuration() -> None:
    """Ensure the required-document catalogue is internally consistent.

    Raises:
        InvalidDocumentConfiguration: When the catalogue is empty, uses an
            unknown ``DocumentType``, reuses a document type across topics,
            requires zero copies, or a composite topic's slot labels do not
            match its slot types.
    """
    if not REQUIRED_DOCUMENTS:
        raise InvalidDocumentConfiguration(
            "At least one required document must be configured"
        )

    known = set(DocumentType)
    invalid_types = sorted(
        ALL_CONFIGURED_DOCUMENT_TYPES - known,
        key=lambda document_type: document_type.value,
    )
    if invalid_types:
        names = ", ".join(str(value) for value in invalid_types)
        raise InvalidDocumentConfiguration(
            f"Configured document types are not valid DocumentType values: {names}"
        )

    for document in REQUIRED_DOCUMENTS:
        if document.required_copies < 1:
            raise InvalidDocumentConfiguration(
                f"Document {document.key!r} must require at least one copy"
            )
        if document.slot_labels and len(document.slot_labels) != len(document.slot_types):
            raise InvalidDocumentConfiguration(
                f"Document {document.key!r} slot labels must match its slot types"
            )

    assigned: dict[DocumentType, str] = {}
    for document in REQUIRED_DOCUMENTS:
        for document_type in document.types():
            previous = assigned.get(document_type)
            if previous is not None:
                raise InvalidDocumentConfiguration(
                    f"Document type {document_type.value!r} is assigned to both "
                    f"{previous!r} and {document.key!r}"
                )
            assigned[document_type] = document.key
