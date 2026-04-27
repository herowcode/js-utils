# Python logger template

Copy `logger.py` into your project (typically `src/logger.py` or a `core/`
folder). Stdlib-only; no extra dependencies required.

## Optional dependencies

- `rich` — pretty colored output in dev. If installed, `setup_logging()` picks
  it up automatically; otherwise falls back to stdlib `StreamHandler`.

```bash
pip install rich  # optional
```

## Usage

```python
from logger import setup_logging, get_logger, bind

setup_logging(service="my-service")
log = get_logger(__name__)

# Canonical signature: msg constant, dynamic values in extra={}
log.info("server_started", extra={"port": 3000})

# Bind context once, reuse across multiple calls
req = bind(log, request_id=request_id, user_id=user_id)
req.info("request_received", extra={"path": "/users/me"})
req.error("downstream_failed", extra={"endpoint": "/api/x"}, exc_info=err)
```

### Production vs dev

Detected via `ENV`, `PYTHON_ENV`, or `NODE_ENV` (any equal to `production`).

- **Production**: one JSON line per log call. Fields: `time`, `level`,
  `service`, `env`, `msg`, plus everything from `extra`. Errors include
  `err.name`, `err.message`, `err.stack`.
- **Dev**: Rich pretty output if `rich` is installed; plain text otherwise.

### Redaction

Fields named `password`, `token`, `api_key`, `apikey`, `authorization`,
`cookie`, or `secret` (case-insensitive) are replaced with `[REDACTED]` in
both `extra` payload and nested dicts. Add more keys via:

```python
setup_logging(service="my-service", extra_redact_keys=frozenset({"cpf", "ssn"}))
```

### Anti-patterns

```python
# ❌ Don't interpolate dynamic values into msg — kills aggregation.
log.info(f"Processed job {job_id} in {ms}ms")

# ✅ Constant msg, dynamics in extra
log.info("job_processed", extra={"job_id": job_id, "duration_ms": ms})
```
