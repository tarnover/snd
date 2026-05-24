# SND API

This document describes the HTTP and WebSocket API exposed by an SND server. The API is the same one used by the official Firefox Send client and clients like [ffsend](https://github.com/timvisee/ffsend) and `sndr`.

All paths are relative to your server origin (e.g. `https://snd.dx.pe`).

## Conventions

- File `id` is `[0-9a-f]{10,16}` (the server currently generates 16-hex-char IDs).
- All payload encryption / decryption happens **client-side**. The server never sees plaintext file contents, filenames, or the decryption key.
- The decryption key is the URL fragment after `#` on `/dl/:id#…` URLs and is never sent to the server.
- The `Authorization` header on read endpoints uses a custom scheme: `send-v1 <base64(hmac)>`. The HMAC is computed over the server-issued `nonce` using a key derived from the password (or from the URL key for unprotected files). See [encryption.md](encryption.md) for the derivation.
- The server replies with `WWW-Authenticate: send-v1 <nonce>` whenever it issues a new nonce. Clients must use the **latest** nonce for the next request.
- `owner_token` is returned at upload time and authenticates owner-only mutations (delete, set password, change params, fetch info). It is opaque, ~20 hex chars, never derivable from the URL.
- `Bearer <token>` is a Firefox Accounts (FxA) OAuth token. Only required if the server is run with `FXA_REQUIRED=1`; otherwise it is optional and unauthenticated callers get an "anonymous" quota.

## Server limits

Defaults (overridable via env vars in `server/config.js`):

| Setting | Default | Env var |
|---|---|---|
| Max file size (encrypted) | 2.5 GiB | `MAX_FILE_SIZE` |
| Max expiration | 7 days | `MAX_EXPIRE_SECONDS` |
| Default expiration | 24 hours | `DEFAULT_EXPIRE_SECONDS` |
| Max download count | 100 | `MAX_DOWNLOADS` |
| Default download count | 1 | `DEFAULT_DOWNLOADS` |

## Endpoints

### `GET /config`

Returns client-facing constants the web app uses to populate its UI (limits, locale list, etc.). Public, unauthenticated. Stable enough to be consumed by third-party clients to discover server limits.

```json
{
  "maxFileSize": 2684354560,
  "expireSeconds": [300, 3600, 86400, 604800],
  "downloadCounts": [1, 2, 3, 4, 5, 20, 50, 100],
  ...
}
```

---

### `POST /api/upload` (HTTP upload)

Uploads an encrypted file in a single request. Prefer the WebSocket endpoint for large files — this endpoint buffers and is slower for big uploads.

Headers:

| Header | Value |
|---|---|
| `Authorization` | `send-v1 <base64-verifier>` |
| `X-File-Metadata` | base64(IV ‖ encrypted metadata blob) |
| `Authorization` (alt) | `Bearer <fxa-token>` if `FXA_REQUIRED=1` |

Body: raw encrypted ciphertext (`application/octet-stream`).

Response `200`:

```json
{
  "url": "https://your-host/dl/<id>/",
  "owner": "<owner_token>",
  "id": "<id>"
}
```

Errors: `400` (missing/invalid headers), `401` (FxA required), `413` (file too large), `500`.

---

### `WS /api/ws` (recommended upload path)

WebSocket protocol for streaming uploads. This is what the web client uses.

1. Client opens `wss://host/api/ws`.
2. Client sends a single JSON text frame:

   ```json
   {
     "fileMetadata": "<base64 metadata>",
     "authorization": "send-v1 <base64-verifier>",
     "timeLimit": 86400,
     "dlimit": 1,
     "bearer": "<optional FxA token>"
   }
   ```

3. Server replies with a JSON text frame:

   ```json
   { "url": "...", "ownerToken": "...", "id": "..." }
   ```

   Or on validation failure: `{ "error": 400 }` / `{ "error": 401 }`.

4. Client streams binary frames of ciphertext, then sends a single `0x00` byte as EOF.
5. Server replies `{ "ok": true }` and closes.
6. On overflow the server sends `{ "error": 413 }`; on internal failure `{ "error": 500 }`.

---

### `GET /api/exists/:id`

Public — used by clients to check whether a file exists before prompting for a password. No auth.

Response `200`:

```json
{ "requiresPassword": false }
```

Sets `WWW-Authenticate: send-v1 <nonce>` so the client can immediately compute the verifier for follow-up calls.

`404` if the file does not exist or has expired.

---

### `GET /api/metadata/:id`

Returns the encrypted metadata blob and TTL. Requires `Authorization: send-v1 <verifier>`.

Response `200`:

```json
{
  "metadata": "<base64 encrypted metadata>",
  "finalDownload": false,
  "ttl": 84231000
}
```

`ttl` is milliseconds remaining. `finalDownload` is true when the next download will exhaust `dlimit`.

Errors: `401` (bad/missing verifier), `404`.

---

### `GET /api/download/:id`

Streams the encrypted file body. Requires `Authorization: send-v1 <verifier>` (use the latest nonce returned by `/api/metadata` or `/api/exists`).

Atomically increments the download counter before streaming. When `dl == dlimit` the file is deleted server-side after the stream finishes. Cancelled / errored downloads decrement the counter back.

Response: `200 application/octet-stream`, body is raw ciphertext, `Content-Length` set.

Errors: `401`, `404` (not found, expired, or quota exhausted).

---

### `GET /api/download/blob/:id`

Identical to `/api/download/:id`. The web client uses it for the XHR `Blob` path so the path can be allowlisted separately if you ever want to apply different rate-limits.

---

### `POST /api/delete/:id`

Owner-only. Deletes the file immediately.

Body: `{ "owner_token": "<token>" }`

Response: `200` on success, `401` (bad owner_token), `404`.

---

### `POST /api/password/:id`

Owner-only. Sets or replaces the password verifier on the file. Once set, future readers must derive `Authorization` from the password rather than the URL key.

Body:

```json
{
  "owner_token": "<token>",
  "auth": "<base64-verifier-derived-from-new-password>"
}
```

Response: `200`, `400` (missing `auth`), `401`, `404`.

---

### `POST /api/params/:id`

Owner-only. Changes the download limit on an existing upload.

Body:

```json
{ "owner_token": "<token>", "dlimit": 5 }
```

`dlimit` must be an integer in `[1, MAX_DOWNLOADS]`. Response: `200`, `400`, `401`, `404`.

If `FXA_REQUIRED=1`, also requires `Authorization: Bearer <fxa>`.

---

### `POST /api/info/:id`

Owner-only. Returns current usage and TTL — useful for owner dashboards.

Body: `{ "owner_token": "<token>" }`

Response `200`:

```json
{ "dlimit": 5, "dtotal": 2, "ttl": 84231000 }
```

Errors: `401`, `404`.

---

### `GET /api/filelist/:id` &nbsp;/&nbsp; `POST /api/filelist/:id`

FxA-only. Used by the Firefox Send web app to sync a signed-in user's file index across devices. `:id` is a 16-char key ID. `GET` streams an opaque encrypted blob; `POST` overwrites it (10 MiB cap).

Requires `Authorization: Bearer <fxa>`. Most self-hosted deployments don't run FxA and can ignore this endpoint.

---

## Health & version endpoints

| Path | Purpose |
|---|---|
| `GET /__version__` | Build metadata from `dist/version.json`. |
| `GET /__lbheartbeat__` | Always `200` — load balancer liveness probe. |
| `GET /__heartbeat__` | `200` if the storage backend responds to `ping()`, else `500`. |
| `GET /__cspreport__` | CSP violation report sink (browser-only). |

## Page routes (non-API)

Non-API GETs return HTML and are mentioned here only so they don't surprise scanners:

- `GET /` — upload UI
- `GET /dl/:id` — download UI (the public share link)
- `GET /download/:id` — `301` redirect to `/dl/:id` (legacy path)
- `GET /login`, `/oauth`, `/error`, `/unsupported/:reason`
- `GET /app.webmanifest`

## Status code summary

| Code | Meaning |
|---|---|
| `200` | OK |
| `400` | Malformed request (missing header, bad JSON, out-of-range param) |
| `401` | Bad / missing `send-v1` verifier, owner_token, or FxA token |
| `404` | Not found, expired, or quota exhausted |
| `413` | File exceeds `MAX_FILE_SIZE` |
| `500` | Server / storage error |

## Further reading

- [encryption.md](encryption.md) — how keys, IVs, and the `send-v1` verifier are derived client-side.
- [security.md](security.md) — threat model.
- [deployment.md](deployment.md) — running your own SND.
