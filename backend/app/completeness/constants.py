"""Configuration for the document completeness module.

The canonical required-document catalogue lives here and nowhere else: every
required document family, the number of copies each application must provide
and the slot structure for composite topics (e.g. CNIC front/back). Verification
logic consumes these definitions so changing a requirement only requires editing
this module, never the service, route or schema code.
"""

from dataclasses import dataclass
from enum import Enum

from app.database.models.enums import DocumentType


class CompletenessStatus(str, Enum):
    """Overall outcome of a completeness check."""

    COMPLETE = "COMPLETE"
    INCOMPLETE = "INCOMPLETE"


class DocumentCompletenessStatus(str, Enum):
    """Completeness of a single required document topic.

    A topic is ``MISSING`` when none of its required copies are uploaded,
    ``PARTIAL`` when at least one copy exists but the quota is unmet and
    ``COMPLETE`` when every required copy is present.
    """

    COMPLETE = "COMPLETE"
    PARTIAL = "PARTIAL"
    MISSING = "MISSING"


@dataclass(frozen=True)
class RequiredDocument:
    """One required upload family with its copy quota.

    Attributes:
        key: Stable identifier for the topic. Matches the frontend catalogue's
            document type value so views can look the topic up in one place;
            composite topics (CNIC) use their own key ("CNIC").
        document_type: Primary backend document type. For composite topics this
            is the first slot type and ``slot_types`` carries the full set.
        label: Employee-facing display name.
        required_copies: Number of uploads the topic requires.
        slot_types: Backend document types that make up the topic. Empty for
            single-type topics, where ``document_type`` is used directly.
        slot_labels: Per-slot display labels aligned with ``slot_types``
            (e.g. "Front", "Back" for CNIC). Must be empty or match the number
            of slot types.
    """

    key: str
    document_type: DocumentType
    label: str
    required_copies: int
    slot_types: tuple[DocumentType, ...] = ()
    slot_labels: tuple[str, ...] = ()

    def types(self) -> tuple[DocumentType, ...]:
        """Return every backend document type belonging to this topic."""
        return self.slot_types or (self.document_type,)


#: Document families every application must provide, in display order. This is
#: the 18-copy catalogue: 1 + 1 + 3 + 3 + 6 + 1 + 1 + 2 uploads.
REQUIRED_DOCUMENTS: tuple[RequiredDocument, ...] = (
    RequiredDocument(
        key="AUTHORITY_LETTER",
        document_type=DocumentType.AUTHORITY_LETTER,
        label="Authority Letter",
        required_copies=1,
    ),
    RequiredDocument(
        key="ACCOUNT_MAINTENANCE_CERTIFICATE",
        document_type=DocumentType.ACCOUNT_MAINTENANCE_CERTIFICATE,
        label="Account Maintenance Certificate",
        required_copies=1,
    ),
    RequiredDocument(
        key="ONE_LINK_LETTER",
        document_type=DocumentType.ONE_LINK_LETTER,
        label="1-Link Application Form",
        required_copies=3,
    ),
    RequiredDocument(
        key="TRIPARTITE_AGREEMENT",
        document_type=DocumentType.TRIPARTITE_AGREEMENT,
        label="Tripartite Agreement",
        required_copies=3,
    ),
    RequiredDocument(
        key="SCHEDULE_OF_CHARGES",
        document_type=DocumentType.SCHEDULE_OF_CHARGES,
        label="Schedule of Charges Agreement (Sub-Biller)",
        required_copies=6,
    ),
    RequiredDocument(
        key="BUSINESS_REQUIREMENT_DOCUMENT",
        document_type=DocumentType.BUSINESS_REQUIREMENT_DOCUMENT,
        label="Onboarding / Business Requirement Document",
        required_copies=1,
    ),
    RequiredDocument(
        key="BILATERAL_AGREEMENT",
        document_type=DocumentType.BILATERAL_AGREEMENT,
        label="Bilateral / Business Agreement",
        required_copies=1,
    ),
    RequiredDocument(
        key="CNIC",
        document_type=DocumentType.CNIC_FRONT,
        label="CNIC (Front & Back)",
        required_copies=2,
        slot_types=(DocumentType.CNIC_FRONT, DocumentType.CNIC_BACK),
        slot_labels=("Front", "Back"),
    ),
)

#: Total number of uploads a fully complete application contains.
TOTAL_REQUIRED_COPIES: int = sum(
    document.required_copies for document in REQUIRED_DOCUMENTS
)

#: Every backend document type the completeness module recognises. Any document
#: type outside this set is reported as unexpected.
ALL_CONFIGURED_DOCUMENT_TYPES: frozenset[DocumentType] = frozenset(
    document_type
    for document in REQUIRED_DOCUMENTS
    for document_type in document.types()
)
