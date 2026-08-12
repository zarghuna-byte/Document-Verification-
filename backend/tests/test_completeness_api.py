"""Tests for the document completeness verification module.

Applications are created through the API; documents are inserted directly via
the ``DocumentRepository`` (bypassing the upload module's duplicate guard) so
partial, duplicate and unexpected sets can be constructed for verification. Only
database metadata is involved -- no files are written.
"""

import pytest

from app.completeness.constants import REQUIRED_DOCUMENTS, RequiredDocument
from app.database.connection import SessionLocal
from app.database.models.document import Document
from app.database.models.enums import (
    DocumentProcessingStatus,
    DocumentType,
)
from app.database.repositories.document_repository import DocumentRepository

API = "/api/v1"

TOPICS = list(REQUIRED_DOCUMENTS)


def create_application(client, created_by: str = "tester") -> int:
    """Create an application via the API and return its id."""
    response = client.post(f"{API}/applications", json={"created_by": created_by})
    assert response.status_code == 201, response.text
    return response.json()["application"]["id"]


def insert_document(
    application_id: int,
    document_type: DocumentType,
    copy_number: int = 1,
    filename: str | None = None,
) -> None:
    """Insert a document row directly, without touching the storage backend."""
    db = SessionLocal()
    try:
        DocumentRepository(db).create(
            application_id=application_id,
            document_type=document_type,
            copy_number=copy_number,
            original_filename=filename or f"{document_type.value.lower()}.pdf",
            stored_file_path=(
                f"applications/APP-{application_id:06d}/test/"
                f"{document_type.value.lower()}.pdf"
            ),
            file_type="application/pdf",
            processing_status=DocumentProcessingStatus.UPLOADED,
        )
    finally:
        db.close()


def topic_slot_types(topic: RequiredDocument) -> list[DocumentType]:
    """Return the backend document types of a topic in slot order."""
    return list(topic.types())


def add_complete_documents(application_id: int) -> None:
    """Insert every required upload: one per topic, per required slot."""
    for topic in TOPICS:
        if topic.slot_types:
            for document_type in topic.slot_types:
                insert_document(application_id, document_type, copy_number=1)
        else:
            for copy_number in range(1, topic.required_copies + 1):
                insert_document(application_id, topic.document_type, copy_number=copy_number)


def add_documents_except(application_id: int, exclude_key: str) -> None:
    """Insert every required upload except the copies of one topic."""
    for topic in TOPICS:
        if topic.key == exclude_key:
            continue
        if topic.slot_types:
            for document_type in topic.slot_types:
                insert_document(application_id, document_type, copy_number=1)
        else:
            for copy_number in range(1, topic.required_copies + 1):
                insert_document(application_id, topic.document_type, copy_number=copy_number)


def verify(client, application_id: int, *, method: str = "get"):
    """Call a completeness endpoint and return the JSON report."""
    url = f"{API}/applications/{application_id}/completeness"
    if method == "post":
        url += "/verify"
    response = client.request(method, url)
    assert response.status_code == 200, response.text
    return response.json()


def topic_by_key(report, key: str) -> dict:
    """Return a required-document entry from a report by its topic key."""
    return next(item for item in report["required_documents"] if item["key"] == key)


# --- Complete application ---------------------------------------------------


def test_complete_application(client):
    application_id = create_application(client)
    add_complete_documents(application_id)

    report = verify(client, application_id)

    assert report["application_id"] == application_id
    assert report["status"] == "COMPLETE"
    assert report["uploaded_copies"] == 18
    assert report["total_copies"] == 18
    assert report["completion_percentage"] == 100.0
    assert report["missing_documents"] == []
    assert report["duplicate_documents"] == []
    assert report["unexpected_documents"] == []
    assert len(report["uploaded_documents"]) == 18
    assert len(report["required_documents"]) == 8
    assert all(item["is_complete"] for item in report["required_documents"])
    assert all(item["status"] == "COMPLETE" for item in report["required_documents"])


# --- Missing documents ------------------------------------------------------


def test_empty_application(client):
    application_id = create_application(client)

    report = verify(client, application_id)

    assert report["status"] == "INCOMPLETE"
    assert report["uploaded_copies"] == 0
    assert report["completion_percentage"] == 0.0
    assert report["uploaded_documents"] == []
    assert len(report["missing_documents"]) == 18
    assert all(item["is_present"] is False for item in report["required_documents"])
    assert all(item["status"] == "MISSING" for item in report["required_documents"])


def test_single_copy_partial(client):
    application_id = create_application(client)
    insert_document(application_id, DocumentType.ONE_LINK_LETTER, copy_number=1)

    report = verify(client, application_id)

    assert report["status"] == "INCOMPLETE"
    assert report["completion_percentage"] == round(100.0 * 1 / 18, 2)
    one_link = topic_by_key(report, "ONE_LINK_LETTER")
    assert one_link["uploaded_copies"] == 1
    assert one_link["is_present"] is True
    assert one_link["is_complete"] is False
    assert one_link["status"] == "PARTIAL"
    assert [slot["is_present"] for slot in one_link["slots"]] == [True, False, False]


def test_missing_third_tripartite_copy(client):
    application_id = create_application(client)
    add_documents_except(application_id, "TRIPARTITE_AGREEMENT")
    tripartite = next(topic for topic in TOPICS if topic.key == "TRIPARTITE_AGREEMENT")
    for copy_number in (1, 2):
        insert_document(application_id, tripartite.document_type, copy_number=copy_number)

    report = verify(client, application_id)

    assert report["status"] == "INCOMPLETE"
    assert report["completion_percentage"] == round(100.0 * 17 / 18, 2)
    missing_labels = {(item["label"], item["slot_label"]) for item in report["missing_documents"]}
    assert ("Tripartite Agreement", "Copy 3") in missing_labels
    tripartite_status = topic_by_key(report, "TRIPARTITE_AGREEMENT")
    assert tripartite_status["status"] == "PARTIAL"
    assert tripartite_status["is_complete"] is False


def test_missing_required_document(client):
    application_id = create_application(client)
    add_documents_except(application_id, "AUTHORITY_LETTER")
    authority = next(topic for topic in TOPICS if topic.key == "AUTHORITY_LETTER")

    report = verify(client, application_id)

    assert report["status"] == "INCOMPLETE"
    assert report["completion_percentage"] == round(100.0 * 17 / 18, 2)
    authority_status = topic_by_key(report, "AUTHORITY_LETTER")
    assert authority_status["status"] == "MISSING"
    assert authority_status["is_present"] is False
    assert {item["label"] for item in report["missing_documents"]} == {
        authority.label
    }


# --- CNIC composite ---------------------------------------------------------


def test_cnic_front_only_is_incomplete(client):
    application_id = create_application(client)
    insert_document(application_id, DocumentType.CNIC_FRONT, copy_number=1)

    report = verify(client, application_id)

    assert report["status"] == "INCOMPLETE"
    cnic = topic_by_key(report, "CNIC")
    assert cnic["status"] == "PARTIAL"
    assert cnic["is_complete"] is False
    assert [slot["label"] for slot in cnic["slots"]] == ["Front", "Back"]
    assert [slot["is_present"] for slot in cnic["slots"]] == [True, False]
    missing = report["missing_documents"]
    assert any(item["slot_label"] == "Back" and item["key"] == "CNIC" for item in missing)


def test_cnic_complete_only_when_both_sides(client):
    application_id = create_application(client)
    insert_document(application_id, DocumentType.CNIC_FRONT, copy_number=1)
    insert_document(application_id, DocumentType.CNIC_BACK, copy_number=1)

    report = verify(client, application_id)

    assert report["status"] == "INCOMPLETE"
    cnic = topic_by_key(report, "CNIC")
    assert cnic["status"] == "COMPLETE"
    assert cnic["is_complete"] is True
    assert cnic["uploaded_copies"] == 2
    assert all(slot["is_present"] for slot in cnic["slots"])


def test_cnic_slot_label_is_front_or_back_never_copy(client):
    application_id = create_application(client)
    insert_document(application_id, DocumentType.CNIC_FRONT, copy_number=1)

    report = verify(client, application_id)

    cnic = topic_by_key(report, "CNIC")
    assert all(slot["label"] in ("Front", "Back") for slot in cnic["slots"])
    assert all("Copy" not in slot["label"] for slot in cnic["slots"])


# --- Duplicates -------------------------------------------------------------


def test_extra_schedule_copy_is_duplicate(client):
    application_id = create_application(client)
    add_complete_documents(application_id)
    insert_document(application_id, DocumentType.SCHEDULE_OF_CHARGES, copy_number=7, filename="scan7.pdf")

    report = verify(client, application_id)

    assert report["status"] == "COMPLETE"
    assert report["completion_percentage"] == 100.0
    assert report["duplicate_documents"] == [
        {
            "key": "SCHEDULE_OF_CHARGES",
            "document_type": "SCHEDULE_OF_CHARGES",
            "copy_count": 7,
        }
    ]
    assert report["missing_documents"] == []


def test_full_schedule_set_is_not_duplicate(client):
    application_id = create_application(client)
    add_complete_documents(application_id)

    report = verify(client, application_id)

    assert report["duplicate_documents"] == []


# --- Unexpected documents ---------------------------------------------------


def test_unexpected_document_type(client):
    application_id = create_application(client)
    add_complete_documents(application_id)
    insert_document(application_id, DocumentType.FORMAL_REQUEST_LETTER, copy_number=1)

    report = verify(client, application_id)

    assert report["status"] == "COMPLETE"
    assert report["unexpected_documents"] == [
        {
            "document_type": "FORMAL_REQUEST_LETTER",
            "copy_count": 1,
        }
    ]


def test_bilateral_is_required(client):
    application_id = create_application(client)
    add_documents_except(application_id, "BILATERAL_AGREEMENT")

    report = verify(client, application_id)

    assert report["status"] == "INCOMPLETE"
    assert topic_by_key(report, "BILATERAL_AGREEMENT")["status"] == "MISSING"


# --- Application not found --------------------------------------------------


def test_application_not_found(client):
    for method in ("get", "post"):
        response = client.request(
            method,
            f"{API}/applications/999999/completeness"
            + ("/verify" if method == "post" else ""),
        )
        assert response.status_code == 404, response.text
        assert response.json()["detail"] == "Application not found"


# --- Endpoint behaviour -----------------------------------------------------


def test_get_and_verify_return_same_report(client):
    application_id = create_application(client)
    add_complete_documents(application_id)

    get_report = verify(client, application_id, method="get")
    post_report = verify(client, application_id, method="post")

    for field in (
        "application_id",
        "status",
        "completion_percentage",
        "uploaded_copies",
        "total_copies",
        "missing_documents",
        "duplicate_documents",
        "unexpected_documents",
        "uploaded_documents",
    ):
        assert get_report[field] == post_report[field], field


def test_uploaded_documents_expose_no_storage_path(client):
    application_id = create_application(client)
    insert_document(application_id, DocumentType.TRIPARTITE_AGREEMENT, copy_number=1)

    report = verify(client, application_id)

    assert "stored_file_path" not in report["uploaded_documents"][0]


# --- Configuration ----------------------------------------------------------


def test_invalid_configuration_raises(client, monkeypatch):
    monkeypatch.setattr(
        "app.completeness.validators.REQUIRED_DOCUMENTS",
        (),
    )
    monkeypatch.setattr(
        "app.completeness.validators.ALL_CONFIGURED_DOCUMENT_TYPES",
        frozenset(),
    )

    response = client.get(f"{API}/applications/1/completeness")

    assert response.status_code == 500
    assert "must be configured" in response.json()["detail"]


def test_overlapping_configuration_raises(client, monkeypatch):
    conflicting = (
        RequiredDocument(
            key="A",
            document_type=DocumentType.CNIC_FRONT,
            label="A",
            required_copies=1,
        ),
        RequiredDocument(
            key="B",
            document_type=DocumentType.CNIC_FRONT,
            label="B",
            required_copies=1,
        ),
    )
    monkeypatch.setattr(
        "app.completeness.validators.REQUIRED_DOCUMENTS",
        conflicting,
    )
    monkeypatch.setattr(
        "app.completeness.validators.ALL_CONFIGURED_DOCUMENT_TYPES",
        frozenset({DocumentType.CNIC_FRONT}),
    )

    response = client.get(f"{API}/applications/1/completeness")

    assert response.status_code == 500
    assert "assigned to both" in response.json()["detail"]
