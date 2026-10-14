const crypto = require('crypto');
const storage = require('../storage');
const config = require('../config');
const mozlog = require('../log');
const Limiter = require('../limiter');
const { encryptedSize } = require('../../app/utils');
const security = require('../security');
const claimUpload = require('../uploadLimit');

const log = mozlog('send.upload');

module.exports = async function(req, res) {
  const newId = crypto.randomBytes(8).toString('hex');
  const metadata = req.header('X-File-Metadata');
  const auth = req.header('Authorization');
  if (!metadata || !auth) {
    return res.sendStatus(400);
  }
  const authParts = auth.split(' ');
  if (
    authParts.length !== 2 ||
    authParts[0] !== 'send-v1' ||
    !/^[A-Za-z0-9+/_-]+={0,2}$/.test(authParts[1])
  ) {
    log.error('upload.authFormat', { scheme: authParts[0] });
    return res.sendStatus(400);
  }
  const owner = crypto.randomBytes(10).toString('hex');
  const meta = {
    owner,
    metadata,
    auth: authParts[1],
    nonce: crypto.randomBytes(16).toString('base64')
  };

  let uploadTimer;
  try {
    if (!(await claimUpload(req))) {
      res.set('Retry-After', String(security.UPLOAD_RATE_WINDOW_SECONDS));
      return res.sendStatus(429);
    }
    const limiter = new Limiter(encryptedSize(config.max_file_size));
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
    //this hasn't been updated to expiration time setting yet
    //if you want to fallback to this code add this
    await storage.set(newId, fileStream, meta, config.default_expire_seconds);
    const url = `${config.deriveBaseUrl(req)}/dl/${newId}/`;
    res.set('WWW-Authenticate', `send-v1 ${meta.nonce}`);
    res.json({
      url,
      owner: meta.owner,
      id: newId
    });
  } catch (e) {
    if (e.message === 'limit') {
      return res.sendStatus(413);
    }
    log.error('upload', e);
    res.sendStatus(500);
  } finally {
    clearTimeout(uploadTimer);
  }
};
