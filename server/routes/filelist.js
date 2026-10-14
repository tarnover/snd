const crypto = require('crypto');
const config = require('../config');
const storage = require('../storage');
const Limiter = require('../limiter');
const security = require('../security');
const claimUpload = require('../uploadLimit');

function id(user, kid) {
  const sha = crypto.createHash('sha256');
  sha.update(user);
  sha.update(kid);
  const hash = sha.digest('hex');
  return `filelist-${hash}`;
}

module.exports = {
  async get(req, res) {
    const kid = req.params.id;
    try {
      const fileId = id(req.user, kid);
      const contentLength = await storage.length(fileId);
      const fileStream = await storage.get(fileId);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Content-Length': contentLength
      });
      fileStream.pipe(res);
    } catch (e) {
      res.sendStatus(404);
    }
  },

  async post(req, res) {
    const kid = req.params.id;
    let uploadTimer;
    try {
      if (!(await claimUpload(req))) {
        res.set('Retry-After', String(security.UPLOAD_RATE_WINDOW_SECONDS));
        return res.sendStatus(429);
      }
      const limiter = new Limiter(1024 * 1024 * 10);
      const abort = error => limiter.destroy(error);
      req.once('aborted', () => abort(new Error('upload aborted')));
      req.once('error', abort);
      req.setTimeout(security.WS_IDLE_TIMEOUT_MS, () => {
        req.destroy(new Error('upload idle timeout'));
      });
      uploadTimer = setTimeout(() => {
        req.destroy(new Error('upload duration exceeded'));
      }, security.WS_MAX_DURATION_MS);
      const fileStream = req.pipe(limiter);
      await storage.set(
        id(req.user, kid),
        fileStream,
        null,
        config.max_expire_seconds
      );
      res.sendStatus(200);
    } catch (e) {
      if (e.message === 'limit') {
        return res.sendStatus(413);
      }
      res.sendStatus(500);
    } finally {
      clearTimeout(uploadTimer);
    }
  }
};
