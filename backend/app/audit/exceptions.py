"""Custom exceptions raised by the audit activity module."""


class AuditError(Exception):
    """Base class for every audit module error.

    Attributes:
        status_code: HTTP status code used for the error response.
        detail: Human-readable description returned to the client.
    """

    status_code: int = 500
    detail: str = "Activity lookup failed"

    def __init__(self, detail: str | None = None) -> None:
        if detail is not None:
            self.detail = detail
        super().__init__(self.detail)


class ApplicationNotFound(AuditError):
    """The referenced application does not exist."""

    status_code = 404
    detail = "Application not found"
