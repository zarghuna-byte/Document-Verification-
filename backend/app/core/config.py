"""Application configuration.

Centralizes all runtime configuration in a single, strongly typed
:class:`Settings` object loaded from environment variables and the ``.env``
file. Configuration values are validated by pydantic-settings at import time so
misconfiguration fails fast during application startup instead of at runtime.
"""

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

Environment = Literal["development", "testing", "production"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]

#: Default connection string when ``DATABASE_URL`` is not provided. Development
#: only; production deployments must set an explicit ``DATABASE_URL``.
_DEFAULT_DATABASE_URL = (
    "postgresql+psycopg://postgres:postgres@localhost:5432/finance_verification"
)

#: Default public prefix under which every API route is mounted.
DEFAULT_API_PREFIX = "/api/v1"

#: Default upload storage root: ``<project_root>/storage``. Files are kept
#: outside the source tree so they never leak into version control.
_DEFAULT_UPLOAD_STORAGE_ROOT = Path(__file__).resolve().parents[3] / "storage"


class Settings(BaseSettings):
    """Typed application settings loaded from environment variables.

    Attributes:
        app_name: Human-readable application name.
        environment: Deployment environment (development, testing or
            production).
        debug: Enables debug behaviour (e.g. verbose error responses). Never
            enabled in production.
        secret_key: Secret used to sign tokens and derive cryptographic keys.
        database_url: SQLAlchemy database connection string.
        log_level: Root logging level.
        api_prefix: URL prefix applied to every API router.
        upload_storage_root: Root directory under which uploaded documents are
            stored on disk.
        max_upload_size_mb: Maximum accepted size for a single uploaded file.
        confidence_threshold: Field confidence below which a critical field
            forces human review (0.0 - 1.0).
        confidence_weights: Relative weight of every confidence source. Sources
            that did not contribute to a field are ignored and the remaining
            weights are renormalized automatically.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = Field(default="finance-verification-system")
    environment: Environment = Field(default="development")
    debug: bool = Field(default=False)
    secret_key: SecretStr = Field(default=SecretStr("change-me-in-production"))
    database_url: str = Field(default=_DEFAULT_DATABASE_URL)
    log_level: LogLevel = Field(default="INFO")
    api_prefix: str = Field(default=DEFAULT_API_PREFIX)
    upload_storage_root: Path = Field(default=_DEFAULT_UPLOAD_STORAGE_ROOT)
    max_upload_size_mb: int = Field(default=25)
    confidence_threshold: float = Field(default=0.85, ge=0.0, le=1.0)
    confidence_weights: dict[str, float] = Field(
        default={
            "regex": 0.50,
            "template": 0.30,
            "ocr": 0.20,
            "ai": 0.00,
        }
    )

    @model_validator(mode="after")
    def _validate_environment(self) -> "Settings":
        """Guard against unsafe combinations for production deployments."""
        if self.environment == "production" and self.debug:
            raise ValueError("DEBUG must be false when ENVIRONMENT is production")
        if self.environment == "production" and self.secret_key.get_secret_value() == (
            "change-me-in-production"
        ):
            raise ValueError("SECRET_KEY must be overridden when ENVIRONMENT is production")
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached ``Settings`` instance.

    Caching keeps a single configuration object for the whole process and makes
    the factory suitable for dependency injection. The cache can be cleared in
    tests by calling ``get_settings.cache_clear()``.
    """
    return Settings()
