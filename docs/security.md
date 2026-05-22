# Security

This document covers the threat model Send operates under, the differences
this fork carries vs. upstream [`timvisee/send`][timvisee-send] and
[`mozilla/send`][mozilla-send], and known limitations.

## Threat model

Send is **end-to-end encrypted between sender and recipient browsers**. The
server stores ciphertext plus a small amount of plaintext metadata (file id,
nonce, owner token hash, expiry, download counter). The decryption key lives
in the URL fragment (the part after `#`) and never reaches the server.

What an attacker controlling the **network** cannot do, provided HTTPS is
used:
- Read uploaded file contents.
- Read filenames / sizes / types (those are encrypted with a key derived from
  the same master secret).

What an attacker controlling the **server** can do:
- Serve modified client JavaScript that exfiltrates the URL fragment as soon
  as a recipient visits the share link. This is a fundamental property of
  any browser-based E2EE app — the operator ships the code that does the
  decryption, so the operator can ship malicious code that does it
  differently.
- Delete or refuse to serve any file.
- See file size, expiry, IP addresses of senders/recipients.

For workflows where the operator-shipped-JS class of risk is unacceptable,
use the [`ffsend`][ffsend] command-line client instead of the web UI. `ffsend`
ships its own implementation of the protocol, so a malicious server cannot
swap out the crypto layer.

## Changes from upstream `timvisee/send`

This fork carries a focused set of server-side security fixes on top of
[`timvisee/send`][timvisee-send]'s 3.4.x line. Each is small, surgical, and
backward-compatible with the on-the-wire protocol.

### Password-derived auth-key strength
`app/keychain.js` — `setPassword` derived the per-share HMAC auth key with
**PBKDF2-HMAC-SHA-256, 100 iterations**. That's roughly 1000× too few for any
modern definition of safe. Raised to **100,000**. OWASP recommends 600,000;
100k is a deliberate compromise that delivers a 1000× improvement while
staying well under one second on mobile browsers. (The decryption key proper
is not affected — it's a fresh random 128 bits in the URL fragment. The
PBKDF2 chain governs the HMAC auth-key used for download authentication when
a sender opts to put a password on a share.)

### Atomic download-count enforcement
`server/routes/download.js`, `server/middleware/auth.js` — the original code
incremented the download counter *after* streaming, so N concurrent requests
sharing one `Authorization` header all read the same `meta.dl`, all streamed,
all incremented at the end. Effective downloads = N regardless of `dlimit`.
The fix uses an atomic `HINCRBY` to *claim* a slot before any work starts,
with a refund on cancel or error. Concurrent requests cannot exceed
`dlimit` any more.

### Strict `Authorization` header parsing
`server/routes/upload.js`, `server/routes/ws.js` — malformed headers
(`"foo"` rather than `"send-v1 <base64>"`) caused `auth.split(' ')[1]` to be
`undefined`, which Redis serialized as the literal string `"undefined"`. The
HMAC key for that file then became
`Buffer.from("undefined", "base64")` — a predictable buffer anyone could
forge against. Now both endpoints require the documented format.

### `FXA_REQUIRED` actually works
`server/config.js` — `config.fxa_required` was referenced in
`server/middleware/auth.js` and `server/routes/ws.js` but **never declared**
in the convict schema. Operators setting `FXA_REQUIRED=true` to enforce
account-only uploads got a silent no-op. The key is now declared.

### `dlimit` input validation
`server/routes/params.js`, `server/routes/ws.js` — `dlimit` accepted
negative, fractional, and non-numeric values. A negative value made the
first download immediately delete the file. Both endpoints now require a
positive integer no greater than `max_downloads`.

### S3 storage isolation
`server/storage/s3.js` — `AWS.config.update(cfg)` mutated the AWS SDK's
global config singleton, potentially redirecting unrelated AWS service
clients (STS, etc.) to a custom S3 endpoint. The config is now passed to
`new AWS.S3(cfg)` directly.

### Promisified storage helpers
`server/storage/redis.js`, `server/storage/index.js` — `setField` and
`incrementField` are now async/awaitable so the call sites above can
serialize correctly.

## CVE posture

The production dependency tree is clean of all known advisories except the
standing **aws-sdk v2 EOL umbrella** advisory (a notification that v2
reached end-of-support; clearing it requires migrating to `@aws-sdk/*` v3).

The dev-build chain still carries vulnerabilities — almost all in the
webpack 4 / babel 6 sub-tree pulled in through `extract-loader`,
`html-loader`, and `webpack-dev-server`. None of these run at production
runtime; clearing them fully requires a webpack 4 → 5 migration, which is
out of scope here.

See the [dependency-update PR](https://github.com/tarnover/send/pull/3) for
the full before/after audit and the list of `npm overrides` used to bump
transitive packages.

## Known limitations

- **Operator JS substitution** — covered above; mitigation is `ffsend`.
- **FxA token verification** delegates to a remote `/verify` endpoint and
  does not verify the JWT signature locally. If `FXA_URL` is ever pointed
  at an attacker-controlled host, the attacker can mint tokens. The
  workaround is to pin `FXA_URL` and serve it over HTTPS.
- **Host header trust under `DETECT_BASE_URL=true`** — opt-in. If you turn
  this on, put Send behind a reverse proxy that strips/normalizes the
  `Host` header before the request reaches Send.
- **`base_url` default** of `https://send.example.com` is a footgun if you
  deploy without setting `BASE_URL` and without setting
  `DETECT_BASE_URL=true`.

## Reporting

Please open a private security advisory at
<https://github.com/tarnover/send/security/advisories/new> rather than a
public issue.

[ffsend]: https://github.com/timvisee/ffsend
[mozilla-send]: https://github.com/mozilla/send
[timvisee-send]: https://github.com/timvisee/send
