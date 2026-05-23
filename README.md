# [![SND](./assets/icon-64x64.png)](https://github.com/tarnover/snd) SND

[![Build status][ci-badge]][ci-link]
[![Container image][container-badge]][container-link]
[![Latest release][release-badge]][release-link]
[![License][repo-license-badge]](LICENSE)

[ci-badge]: https://github.com/tarnover/snd/actions/workflows/docker.yml/badge.svg?branch=master
[ci-link]: https://github.com/tarnover/snd/actions/workflows/docker.yml
[container-badge]: https://img.shields.io/badge/ghcr.io-tarnover%2Fsnd-blue
[container-link]: https://github.com/tarnover/snd/pkgs/container/snd
[release-badge]: https://img.shields.io/github/v/tag/tarnover/snd
[release-link]: https://github.com/tarnover/snd/tags
[repo-license-badge]: https://img.shields.io/github/license/tarnover/snd.svg

A privacy-friendly, browser-encrypted file-sharing service. Files are encrypted
client-side before they reach the server; the decryption key never leaves the
sender's browser unless explicitly shared in the link fragment.

This repository is a maintained fork of [`timvisee/send`][timvisee-send], which
is in turn a fork of [Mozilla's Firefox Send][mozilla-send] (discontinued in
2020). The fork lineage is:

```
mozilla/send  →  timvisee/send  →  tarnover/snd (this repo)
```

The protocol stays compatible with the [`sndr`][sndr] command-line client
so links produced by this server can be uploaded to / downloaded from with the
CLI as well as the browser.

## What's different in this fork

- **Security hardening** — atomic download-count enforcement, strict
  `Authorization`-header parsing, PBKDF2 iterations bumped 1000×, and a few
  smaller fixes. See [docs/security.md](docs/security.md) for the audit.
- **GitHub-hosted images** — multi-arch (`linux/amd64`, `linux/arm64`)
  containers built by GitHub Actions and published to
  [`ghcr.io/tarnover/snd`](https://github.com/tarnover/snd/pkgs/container/snd).
- **CVE clean production tree** — dep audit landed all known production
  advisories down to a single low-severity SDK-EOL warning. See the
  [deps PR](https://github.com/tarnover/snd/pull/3) for the full diff.
  The remaining `npm audit` and deprecation noise (visible during
  `docker build` and `npm ci`) is **entirely in the dev / build chain**
  — webpack 4 + babel 6 + extract-text / extract / html / copy loaders
  — and never reaches the runtime image. The Docker runtime stage
  installs only production deps via `npm ci --production` and is built
  from a clean tree. Clearing the dev-chain noise requires a webpack-5
  migration which is tracked but out of scope for this fork's current
  direction.
- **Short share path** — public download links are `/<base>/dl/<id>/#<key>`
  instead of the longer `/download/...` (the legacy path 301-redirects).

Everything else — protocol, file format, web UI, configuration knobs — is
unchanged and remains compatible with downstream tooling.

[sndr]: https://github.com/tarnover/snder
[ffsend]: https://github.com/timvisee/ffsend
[mozilla-send]: https://github.com/mozilla/send
[timvisee-send]: https://github.com/timvisee/send

---

**Docs:** [FAQ](docs/faq.md) · [Encryption](docs/encryption.md) · [Build](docs/build.md) · [Docker](docs/docker.md) · [Deployment](docs/deployment.md) · [More](docs/)

---

## Table of contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Clients](#clients)
- [Requirements](#requirements)
- [Development](#development)
- [Commands](#commands)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Localization](#localization)
- [Public instances](#public-instances)
- [Contributing](#contributing)
- [License](#license)

---

## What it does

SND lets you share a file by uploading it from the browser; the file is
encrypted with a randomly-generated key before upload and the URL handed back
to you contains the key in its fragment. Anyone with the link can fetch and
decrypt; the server only ever sees ciphertext.

Each share has a configurable expiry (default 24 hours, up to 7 days) and a
download counter (defaults to one) — when either runs out the ciphertext is
deleted. Owners can password-protect a share, change its download limit, or
delete it themselves.

---

## Quick start

Pull the multi-arch image from GitHub Container Registry and point it at a
Redis instance:

```bash
docker pull ghcr.io/tarnover/snd:latest

docker run --rm -p 1443:1443 \
    -v "$PWD/uploads:/uploads" \
    -e DETECT_BASE_URL=true \
    -e REDIS_HOST=redis \
    -e FILE_DIR=/uploads \
    ghcr.io/tarnover/snd:latest
```

Browse to <http://localhost:1443>. For S3, GCS, custom branding, and other
options, see [docs/docker.md](docs/docker.md).

---

## Clients

SND is a server + web UI, but it speaks a documented protocol that has
multiple clients:

| Client | Description |
|---|---|
| **Browser** — _this repository_ | Drag-and-drop web UI, no install required. Works in mobile browsers. Also installable as a [Progressive Web App](#install-as-a-progressive-web-app) for a standalone-app feel. |
| **Command-line** — [`sndr`][sndr] | Native CLI for SND, descended from [`ffsend`][ffsend] (by [@timvisee](https://github.com/timvisee)). Cross-platform, scriptable, supports the full protocol (upload, download, params, password, delete). The recommended client for sensitive transfers because it avoids the operator-shipped-JS class of risks that fundamentally limit any browser-based E2EE app. Runs on Android via Termux. |
| **Thunderbird** | The [FileLink provider for Send](https://addons.thunderbird.net/thunderbird/addon/filelink-provider-for-send/) extension lets you attach via a hosted SND instance from inside Thunderbird. |

The legacy `android/` and `ios/` WebView wrappers carried by upstream
`mozilla/send` were unmaintained, hard-coded the dead `send.firefox.com`
service, and have been removed from this fork. Mobile users should use the
web UI in their browser or `sndr`.

If you operate a public SND instance and want to recommend a single client to
users for security-critical use, point them at `sndr`.

### Install as a Progressive Web App

SND ships a Web App Manifest with the new brand mark, so any deployed
instance can be installed as a Progressive Web App from a modern browser.
The result is a standalone app window with the SND square-mono-`S` icon in
your dock / taskbar / launcher and no browser chrome — same site, same
behaviour, just out of the tab strip.

After visiting your instance:

- **Desktop Chromium** (Chrome, Edge, Brave, Arc, Opera) — click the install
  icon at the right of the address bar, or `⋮ → Install SND`.
- **Android Chrome** — `⋮ → Install app` (or "Add to Home screen" on older
  builds). Installs as a real app on your home screen and in your app drawer.
- **iOS / iPadOS Safari** — share button → "Add to Home Screen".
- **Firefox desktop** — no native PWA install (Mozilla removed the feature in
  Firefox 87). Use a Chromium browser, or just keep SND as a pinned tab.

No operator action is required — the manifest, icons, and theme color are
already in place. If you've customised the brand via `UI_CUSTOM_ASSETS_*`
config (see [docs/docker.md](docs/docker.md)), those icons flow through to
the PWA install as well.

---

## Requirements

- [Node.js](https://nodejs.org/) — `^16.13.0` per `package.json`; newer LTS
  versions (18, 20) also work for running and building.
- [Redis](https://redis.io/) — metadata store. Required in production; the
  dev server stubs it.
- One of:
  - Local filesystem (default)
  - [AWS S3](https://aws.amazon.com/s3/) or any S3-compatible object store
  - [Google Cloud Storage](https://cloud.google.com/storage)

---

## Development

```bash
git clone https://github.com/tarnover/snd.git
cd snd
npm install
npm start
```

Then browse to <http://localhost:8080>. The dev server watches files and
reloads automatically. Frontend unit tests are mounted at
<http://localhost:8080/test>.

---

## Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies. |
| `npm start` | Run the dev server with hot reload on `:8080`. |
| `npm run build` | Build production assets into `dist/`. |
| `npm run prod` | Run the production Express server on `:1443` (requires `npm run build` first). |
| `npm test` | Run the mocha backend tests + frontend test runner. |
| `npm run lint` | Lint CSS and JS. |
| `npm run format` | Format with Prettier. |

---

## Configuration

The server reads configuration from environment variables. The full schema
with defaults is in [`server/config.js`](server/config.js); commonly-tuned
options are tabulated in [docs/docker.md](docs/docker.md). Highlights:

- `BASE_URL` — the public URL where SND is reachable. Required in production
  unless `DETECT_BASE_URL=true` is set (which trusts the `Host` header).
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_USER`, `REDIS_PASSWORD`, `REDIS_DB`.
- `S3_BUCKET` / `GCS_BUCKET` / `FILE_DIR` — pick one storage backend.
- `MAX_FILE_SIZE`, `MAX_EXPIRE_SECONDS`, `MAX_DOWNLOADS` — per-share caps.
- `FXA_CLIENT_ID`, `FXA_URL`, `FXA_REQUIRED` — optional Firefox-Accounts
  integration for authenticated uploads.

---

## Deployment

- **Container** — see [docs/docker.md](docs/docker.md). The image is published
  at `ghcr.io/tarnover/snd:latest` and tagged per release.
- **Bare-metal Linux** — see [docs/deployment.md](docs/deployment.md) for an
  Apache reverse-proxy example.
- **AWS** — see [docs/AWS.md](docs/AWS.md) for an Ubuntu Server walkthrough.

If you run a public instance, please read
[docs/takedowns.md](docs/takedowns.md) about abuse and DMCA handling — Mozilla
shut their own service down primarily because of abuse, and you should plan
for it.

---

## Localization

Localization is handled via [Fluent](https://projectfluent.org/) (`.ftl`
files under `public/locales/`). See [docs/localization.md](docs/localization.md).

---

## Public instances

Public instances are tracked at
<https://github.com/timvisee/send-instances/>. If you stand up an instance and
want it listed there, follow the contribution instructions in that repo.

---

## Contributing

Pull requests and issues are welcome at
<https://github.com/tarnover/snd>. Please follow the existing code style
(`npm run format` + `npm run lint`) and add a test where it makes sense.

If a change applies equally well to the upstream `timvisee/send` fork, please
also open it there so the broader community benefits.

---

## Acknowledgements

This project would not exist without three sets of people:

- **Mozilla**, who built the original [Firefox Send][mozilla-send] and
  open-sourced both the client encryption protocol and the entire codebase.
- **Tim Visee** ([@timvisee](https://github.com/timvisee)), who kept the
  service alive after Mozilla discontinued it — both as the
  [`timvisee/send`][timvisee-send] server fork and as the
  [`ffsend`][ffsend] CLI.
- The **localization contributors** listed in
  [CONTRIBUTORS](CONTRIBUTORS).

---

## License

[Mozilla Public License Version 2.0](LICENSE)

`qrcode.js` is licensed under MIT — see
<https://github.com/kazuhikoarase/qrcode-generator>.
