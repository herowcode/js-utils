# `@herowcode/utils/auth`

**`decodeJWT` does NOT verify signatures.** Everything here reads a JWT without checking who signed it, so use it for UX decisions (refresh a token, hide a screen), never to authorize a request. Verify tokens on the server with your auth library. Universal: no Node imports.

```typescript
import {
  decodeJWT,
  extractBearerToken,
  getJWTExp,
  isJWTExpired,
  isJWTExpiring,
} from '@herowcode/utils/auth';
```

---

## `decodeJWT(token)`

Decodes the payload of a three-part token. This does NOT verify the signature: anyone can forge a token this function accepts.

```typescript
decodeJWT<{ sub: string; exp: number }>(token); // → { sub: "42", exp: 1767225600 }
decodeJWT('not-a-jwt');                         // → null
```

Invalid input returns: `null` when the token does not have exactly three parts, the payload is not valid base64url or UTF-8 or JSON, or the JSON is not an object (arrays and primitives).

### Replacing a local copy

Local `JSON.parse(atob(token.split('.')[1]))` throws on malformed input and breaks on base64url (`-`, `_`) and UTF-8 names. This returns `null` instead of throwing.

---

## `getJWTExp(token)`

The `exp` claim in **seconds** since the epoch (the JWT unit, not milliseconds).

```typescript
getJWTExp(token); // → 1767225600
```

Invalid input returns: `null` (malformed token, missing `exp`, or an `exp` that is not a number).

### Replacing a local copy

Local helpers return `exp * 1000` (milliseconds) or `undefined`, and compare against `Date.now()`. This returns seconds, the JWT unit, and `null` when absent.

---

## `isJWTExpired(token)`

True when `exp` has passed. Fails closed: a malformed token or a missing or non-numeric `exp` counts as expired.

```typescript
if (isJWTExpired(token)) redirectToLogin();
```

Invalid input returns: `true`.

### Replacing a local copy

A local `payload.exp * 1000 < Date.now()` evaluates to `false` (not expired) when `exp` is missing or the token is malformed. This fails closed and returns `true`.

---

## `isJWTExpiring(token, options?)`

True when the token expires within `marginSeconds` (default `30`), so you can refresh slightly early. The margin is in **seconds**. Expired tokens are expiring. Fails closed like `isJWTExpired`.

```typescript
if (isJWTExpiring(token)) await refresh();
if (isJWTExpiring(token, { marginSeconds: 120 })) await refresh();
```

| Option | Default | Description |
|--------|---------|-------------|
| `marginSeconds` | `30` | Seconds before `exp` that already count as expiring; a non-finite value falls back to 30 and a negative one to 0 |

Invalid input returns: `true`.

### Replacing a local copy

Local `isTokenExpiring(token, thresholdSeconds)` helpers often multiply by 60 by mistake, treating seconds as minutes. Here the unit is in the option name.

---

## `extractBearerToken(header)`

Returns the token of an `Authorization: Bearer <token>` header. The scheme is case-insensitive, and surrounding whitespace is ignored.

```typescript
extractBearerToken(request.headers.get('authorization')); // "Bearer abc" → "abc"
```

Invalid input returns: `null` (other schemes, no token, extra parts, `null`/`undefined`).

### Replacing a local copy

Replaces `header.replace('Bearer ', '')` and `header.split(' ')[1]`, which accept `Basic abc` and extra parts. Only a single `Bearer <token>` pair passes (the scheme is case-insensitive).

---

[← Back to README](../README.md)
