const storage = require('./storage');
const security = require('./security');

module.exports = async function claimUpload(req) {
  const checks = [
    storage.claimRateLimit(
      'send:upload-rate:global',
      security.UPLOADS_PER_WINDOW_GLOBAL,
      security.UPLOAD_RATE_WINDOW_SECONDS
    )
  ];
  const source = security.requestSource(req);
  if (source) {
    checks.push(
      storage.claimRateLimit(
        `send:upload-rate:${source}`,
        security.UPLOADS_PER_WINDOW_SOURCE,
        security.UPLOAD_RATE_WINDOW_SECONDS
      )
    );
  }
  const results = await Promise.all(checks);
  return results.every(Boolean);
};
