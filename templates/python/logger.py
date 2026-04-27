"""Structured logger template — copy this file into your project as `src/logger.py`.

Contract: every log call emits a single JSON line in production. The signature
mirrors stdlib `logging`:

    log.info("event_name", extra={"job_id": "...", "duration_ms": 12})

`msg` is a constant identifier; dynamic values go into `extra`. Use `bind()` to
attach persistent context (request_id, user_id) across multiple calls.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from datetime import datetime, timezone
from typing import Any

DEFAULT_REDACT_KEYS = frozenset(
    {
        "password",
        "token",
        "api_key",
        "apikey",
        "authorization",
        "cookie",
        "secret",
    }
)

REDACTED = "[REDACTED]"

# Reserved attributes set by `logging.LogRecord` itself; we skip these when
# serializing extras.
_RESERVED_ATTRS = frozenset(
    {
        "args",
        "asctime",
        "created",
        "exc_info",
        "exc_text",
        "filename",
        "funcName",
        "levelname",
        "levelno",
        "lineno",
        "message",
        "module",
        "msecs",
        "msg",
        "name",
        "pathname",
        "process",
        "processName",
        "relativeCreated",
        "stack_info",
        "taskName",
        "thread",
        "threadName",
    }
)


def _is_production() -> bool:
    env = os.environ.get("ENV") or os.environ.get("PYTHON_ENV") or os.environ.get("NODE_ENV")
    return (env or "").lower() == "production"


def _resolve_level(level: str | None) -> int:
    if level:
        return logging.getLevelName(level.upper())
    env_level = os.environ.get("LOG_LEVEL")
    if env_level:
        return logging.getLevelName(env_level.upper())
    return logging.INFO if _is_production() else logging.DEBUG


def _redact(value: Any, keys: frozenset[str]) -> Any:
    if isinstance(value, dict):
        return {k: REDACTED if k.lower() in keys else _redact(v, keys) for k, v in value.items()}
    if isinstance(value, list):
        return [_redact(v, keys) for v in value]
    return value


class RedactFilter(logging.Filter):
    """Walks every record attribute and replaces sensitive keys with [REDACTED]."""

    def __init__(self, extra_keys: frozenset[str] | None = None) -> None:
        super().__init__()
        self._keys = DEFAULT_REDACT_KEYS | (extra_keys or frozenset())

    def filter(self, record: logging.LogRecord) -> bool:
        for key in list(record.__dict__):
            if key in _RESERVED_ATTRS:
                continue
            if key.lower() in self._keys:
                record.__dict__[key] = REDACTED
            else:
                record.__dict__[key] = _redact(record.__dict__[key], self._keys)
        return True


class JsonFormatter(logging.Formatter):
    """Single-line JSON output. One emission per log call."""

    def __init__(self, service: str) -> None:
        super().__init__()
        self._service = service

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "time": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname.lower(),
            "service": self._service,
            "env": os.environ.get("ENV") or os.environ.get("PYTHON_ENV") or "development",
            "msg": record.getMessage(),
        }

        for key, value in record.__dict__.items():
            if key in _RESERVED_ATTRS or key.startswith("_"):
                continue
            payload[key] = value

        if record.exc_info:
            exc_type, exc_value, _ = record.exc_info
            payload["err"] = {
                "name": exc_type.__name__ if exc_type else "Exception",
                "message": str(exc_value) if exc_value else "",
                "stack": self.formatException(record.exc_info),
            }

        return json.dumps(payload, default=str, ensure_ascii=False)


_TEXT_FORMAT = "%(asctime)s %(levelname)-5s %(name)s — %(message)s"


def _build_dev_handler() -> logging.Handler:
    try:
        from rich.logging import RichHandler

        handler = RichHandler(rich_tracebacks=True, show_time=True, show_path=False, markup=False)
        handler.setFormatter(logging.Formatter("%(message)s"))
        return handler
    except ImportError:
        handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(logging.Formatter(_TEXT_FORMAT))
        return handler


def setup_logging(
    service: str,
    level: str | None = None,
    extra_redact_keys: frozenset[str] | None = None,
) -> None:
    """Configure the root logger. Idempotent — safe to call multiple times."""
    root = logging.getLogger()
    root.setLevel(_resolve_level(level))

    # Remove existing handlers to keep the configuration clean across reloads.
    for h in list(root.handlers):
        root.removeHandler(h)

    if _is_production():
        handler: logging.Handler = logging.StreamHandler(sys.stdout)
        handler.setFormatter(JsonFormatter(service=service))
    else:
        handler = _build_dev_handler()

    handler.addFilter(RedactFilter(extra_redact_keys))
    root.addHandler(handler)

    # Stash service so child loggers can include it via JsonFormatter.
    root._service = service  # type: ignore[attr-defined]


def get_logger(name: str | None = None) -> logging.Logger:
    """Returns a regular `logging.Logger`. Use `bind()` for context binding."""
    return logging.getLogger(name)


_LOG_LEVEL_METHODS = ("debug", "info", "warning", "error", "critical")


class _BoundLogger:
    """Thin wrapper that merges persistent context into every call's `extra`.

    Intentionally not a `LoggerAdapter` — adapters require positional args we
    don't want callers to pass. The wrapper exposes the same `(msg, extra=...)`
    signature as `logging.Logger`.
    """

    __slots__ = ("_logger", "_context")

    def __init__(self, logger: logging.Logger, context: dict[str, Any]) -> None:
        self._logger = logger
        self._context = context

    def bind(self, **fields: Any) -> _BoundLogger:
        return _BoundLogger(self._logger, {**self._context, **fields})

    def _emit(self, level: str, msg: str, extra: dict[str, Any] | None, **kwargs: Any) -> None:
        merged = {**self._context, **(extra or {})}
        getattr(self._logger, level)(msg, extra=merged, **kwargs)

    def debug(self, msg: str, *, extra: dict[str, Any] | None = None, **kw: Any) -> None:
        self._emit("debug", msg, extra, **kw)

    def info(self, msg: str, *, extra: dict[str, Any] | None = None, **kw: Any) -> None:
        self._emit("info", msg, extra, **kw)

    def warning(self, msg: str, *, extra: dict[str, Any] | None = None, **kw: Any) -> None:
        self._emit("warning", msg, extra, **kw)

    warn = warning

    def error(self, msg: str, *, extra: dict[str, Any] | None = None, **kw: Any) -> None:
        self._emit("error", msg, extra, **kw)

    def critical(self, msg: str, *, extra: dict[str, Any] | None = None, **kw: Any) -> None:
        self._emit("critical", msg, extra, **kw)


def bind(logger: logging.Logger | _BoundLogger, **fields: Any) -> _BoundLogger:
    """Returns a new logger with persistent context merged into every call."""
    if isinstance(logger, _BoundLogger):
        return logger.bind(**fields)
    return _BoundLogger(logger, dict(fields))


__all__ = [
    "DEFAULT_REDACT_KEYS",
    "JsonFormatter",
    "RedactFilter",
    "bind",
    "get_logger",
    "setup_logging",
]
