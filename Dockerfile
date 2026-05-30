##
# Send
#
# License https://gitlab.com/timvisee/send/blob/master/LICENSE
##

# Build project
FROM node:20-alpine AS builder

RUN set -x \
  # Change node uid/gid
  && apk --no-cache add shadow \
  && groupmod -g 1001 node \
  && usermod -u 1001 -g 1001 node

RUN set -x \
    # Add user
    && addgroup --gid 1000 app \
    && adduser --disabled-password \
        --gecos '' \
        --ingroup app \
        --home /app \
        --uid 1000 \
        app

COPY --chown=app:app . /app

USER app
WORKDIR /app

RUN set -x \
    # Network resilience for npm ci under qemu emulation (arm64) where
    # ECONNRESET against the npm registry is common. Defaults are
    # fetch-retries=2 / fetch-timeout=300000; bumping both.
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 600000 \
    # Build. --legacy-peer-deps: the lockfile is resolved that way
    # (e.g. raw-loader@3 peer-requires webpack 4 while we run webpack 5);
    # npm 10's strict ci peer enforcement otherwise rejects it.
    && PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm ci --legacy-peer-deps \
    && npm run build

# Main image
FROM node:20-alpine

RUN set -x \
  # Change node uid/gid
  && apk --no-cache add shadow \
  && groupmod -g 1001 node \
  && usermod -u 1001 -g 1001 node

RUN set -x \
    # Add user
    && addgroup --gid 1000 app \
    && adduser --disabled-password \
        --gecos '' \
        --ingroup app \
        --home /app \
        --uid 1000 \
        app

USER app
WORKDIR /app

COPY --chown=app:app package*.json ./
COPY --chown=app:app app app
COPY --chown=app:app common common
COPY --chown=app:app public/locales public/locales
COPY --chown=app:app server server
COPY --chown=app:app --from=builder /app/dist dist

RUN set -x \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-timeout 600000 \
    && npm ci --omit=dev --legacy-peer-deps \
    && npm cache clean --force
RUN mkdir -p /app/.config/configstore
RUN ln -s dist/version.json version.json

ENV PORT=1443

EXPOSE ${PORT}

CMD ["node", "server/bin/prod.js"]
