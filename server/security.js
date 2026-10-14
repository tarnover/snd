const crypto = require('crypto');
const config = require('./config');
const { encryptedSize } = require('../app/utils');

function positiveInteger(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isSafeInteger(value) && value > 0 ? value : fallback;
}

const maxEncryptedFileSize = encryptedSize(config.max_file_size);
const maxUploadDurationMs = positiveInteger(
  'WS_MAX_DURATION_MS',
  24 * 60 * 60 * 1000
);
const uploadReservationSeconds = Math.max(
  positiveInteger('UPLOAD_RESERVATION_SECONDS', 25 * 60 * 60),
  Math.ceil(maxUploadDurationMs / 1000) + 60
);

module.exports = {
  MAX_ENCRYPTED_FILE_SIZE: maxEncryptedFileSize,
  MAX_STORAGE_BYTES: positiveInteger(
    'MAX_STORAGE_BYTES',
    maxEncryptedFileSize * 100
  ),
  MAX_STORED_BLOBS: positiveInteger('MAX_STORED_BLOBS', 100000),
  MIN_STORAGE_BYTES_PER_BLOB: positiveInteger(
    'MIN_STORAGE_BYTES_PER_BLOB',
    64 * 1024
  ),
  UPLOAD_RESERVATION_SECONDS: uploadReservationSeconds,
  UPLOAD_RATE_WINDOW_SECONDS: positiveInteger(
    'UPLOAD_RATE_WINDOW_SECONDS',
    60 * 60
  ),
  UPLOADS_PER_WINDOW_GLOBAL: positiveInteger(
    'UPLOADS_PER_WINDOW_GLOBAL',
    10000
  ),
  UPLOADS_PER_WINDOW_SOURCE: positiveInteger(
    'UPLOADS_PER_WINDOW_SOURCE',
    200
  ),
  STORAGE_CLEANUP_INTERVAL_MS: positiveInteger(
    'STORAGE_CLEANUP_INTERVAL_MS',
    60 * 1000
  ),
  STORAGE_CLEANUP_BATCH_SIZE: positiveInteger(
    'STORAGE_CLEANUP_BATCH_SIZE',
    100
  ),
  WS_MAX_PAYLOAD_BYTES: positiveInteger('WS_MAX_PAYLOAD_BYTES', 1024 * 1024),
  WS_MAX_CONTROL_BYTES: positiveInteger(
    'WS_MAX_CONTROL_BYTES',
    256 * 1024
  ),
  WS_MAX_METADATA_BYTES: positiveInteger(
    'WS_MAX_METADATA_BYTES',
    128 * 1024
  ),
  WS_MAX_CONNECTIONS: positiveInteger('WS_MAX_CONNECTIONS', 64),
  WS_FIRST_MESSAGE_TIMEOUT_MS: positiveInteger(
    'WS_FIRST_MESSAGE_TIMEOUT_MS',
    10 * 1000
  ),
  WS_IDLE_TIMEOUT_MS: positiveInteger('WS_IDLE_TIMEOUT_MS', 60 * 1000),
  WS_MAX_DURATION_MS: maxUploadDurationMs,
  PASSWORD_ATTEMPTS_PER_SOURCE: positiveInteger(
    'PASSWORD_ATTEMPTS_PER_SOURCE',
    30
  ),
  PASSWORD_ATTEMPTS_PER_SHARE: positiveInteger(
    'PASSWORD_ATTEMPTS_PER_SHARE',
    300
  ),
  PASSWORD_ATTEMPT_WINDOW_SECONDS: positiveInteger(
    'PASSWORD_ATTEMPT_WINDOW_SECONDS',
    5 * 60
  ),
  FXA_TIMEOUT_MS: positiveInteger('FXA_TIMEOUT_MS', 5000),
  FXA_MAX_CONCURRENCY: positiveInteger('FXA_MAX_CONCURRENCY', 32),
  FXA_MAX_RESPONSE_BYTES: positiveInteger('FXA_MAX_RESPONSE_BYTES', 64 * 1024),
  requestSource(req) {
    const forwarded = req && req.headers && req.headers['x-forwarded-for'];
    const trustedHops = Number(process.env.TRUSTED_PROXY_HOPS || 0);
    let address = req && req.socket && req.socket.remoteAddress;
    if (forwarded && trustedHops > 0 && Number.isSafeInteger(trustedHops)) {
      const addresses = String(forwarded)
        .split(',')
        .map(value => value.trim())
        .filter(Boolean);
      address = addresses[addresses.length - trustedHops] || address;
    } else if (forwarded) {
      // Do not collapse all users into an unconfigured proxy's address, and do
      // not trust a forwarding header until the operator declares proxy hops.
      return null;
    }
    address = address || 'unknown';
    return crypto
      .createHash('sha256')
      .update(address)
      .digest('hex')
      .slice(0, 32);
  }
};
