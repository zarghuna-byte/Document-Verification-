"""Audit activity module.

Provides read-only access to the append-only audit log so employee-facing views
(dashboard recent activity, application activity feed) can surface what has
happened in the system. No audit records are written here; other pipeline
modules persist them as they run.
"""

from app.audit.routes import router

__all__ = ["router"]
