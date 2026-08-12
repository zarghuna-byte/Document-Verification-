"""Tests for the audit activity module.

Audit events are inserted directly through the repository (as the pipeline
modules do) and read back through the global and per-application endpoints.
"""

import pytest

from app.database.connection import SessionLocal
from app.database.repositories.audit_log_repository import AuditLogRepository

API = "/api/v1"


def create_application(client) -> int:
    """Create an application via the API and return its id."""
    response = client.post(f"{API}/applications", json={"created_by": "tester"})
    assert response.status_code == 201, response.text
    return response.json()["application"]["id"]


def insert_event(
    *,
    application_id: int | None = None,
    username: str = "employee",
    action: str = "TEST_ACTION",
    details: dict | None = None,
) -> int:
    """Insert an audit event directly and return its id."""
    db = SessionLocal()
    try:
        entry = AuditLogRepository(db).create(
            application_id=application_id,
            username=username,
            action=action,
            details=details,
        )
        return entry.id
    finally:
        db.close()


def list_activity(client, *, application_id: int | None = None, limit: int | None = None):
    """Call an activity endpoint and return the JSON body."""
    url = f"{API}/activity"
    if application_id is not None:
        url = f"{API}/applications/{application_id}/activity"
    response = client.get(url, params={"limit": limit} if limit else None)
    assert response.status_code == 200, response.text
    return response.json()


def test_empty_global_feed(client):
    body = list_activity(client)

    assert body["application_id"] is None
    assert body["total"] == 0
    assert body["events"] == []


def test_global_feed_returns_recent_events(client):
    application_id = create_application(client)
    first = insert_event(application_id=application_id, action="FIRST")
    second = insert_event(application_id=application_id, action="SECOND")

    body = list_activity(client)

    assert body["total"] == 2
    assert [event["id"] for event in body["events"]] == [second, first]
    assert body["events"][0]["action"] == "SECOND"
    assert body["events"][0]["application_id"] == application_id
    assert body["events"][0]["username"] == "employee"


def test_global_feed_includes_unscoped_events(client):
    application_id = create_application(client)
    insert_event(application_id=application_id)
    insert_event(application_id=None, action="SYSTEM_EVENT")

    body = list_activity(client)

    assert body["total"] == 2


def test_application_feed_is_scoped(client):
    application_id = create_application(client)
    other_application_id = create_application(client)
    insert_event(application_id=application_id, action="FOR_APP")
    insert_event(application_id=other_application_id, action="FOR_OTHER")

    body = list_activity(client, application_id=application_id)

    assert body["application_id"] == application_id
    assert body["total"] == 1
    assert body["events"][0]["action"] == "FOR_APP"


def test_limit_is_applied(client):
    application_id = create_application(client)
    for _ in range(3):
        insert_event(application_id=application_id)

    body = list_activity(client, limit=1)

    assert body["total"] == 1
    assert len(body["events"]) == 1


def test_application_not_found(client):
    response = client.get(f"{API}/applications/999999/activity")
    assert response.status_code == 404, response.text
    assert response.json()["detail"] == "Application not found"


def test_invalid_limit_rejected(client):
    response = client.get(f"{API}/activity", params={"limit": 0})
    assert response.status_code == 422, response.text


@pytest.mark.parametrize("method,path", [("GET", "/activity")])
def test_activity_endpoint_is_registered(client, method, path):
    response = client.request(method, f"{API}{path}")
    assert response.status_code == 200, response.text
