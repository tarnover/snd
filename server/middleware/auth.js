const assert = require('assert');
const crypto = require('crypto');
const storage = require('../storage');
const config = require('../config');
const fxa = require('../fxa');
const security = require('../security');

module.exports = {
  hmac: async function(req, res, next) {
    const id = req.params.id;
    const authHeader = req.header('Authorization');
    if (id && authHeader) {
      try {
        const auth = req.header('Authorization').split(' ')[1];
        const meta = await storage.metadata(id);
        if (!meta) {
          return res.sendStatus(404);
        }
        let sourceRateKey;
        if (meta.pwd) {
          const source = security.requestSource(req);
          sourceRateKey = source
            ? `send:password-attempt:${id}:${source}`
            : null;
          const shareRateKey = `send:password-attempt:${id}:all`;
          const checks = [
            storage.claimRateLimit(
              shareRateKey,
              security.PASSWORD_ATTEMPTS_PER_SHARE,
              security.PASSWORD_ATTEMPT_WINDOW_SECONDS
            )
          ];
          if (sourceRateKey) {
            checks.push(
              storage.claimRateLimit(
                sourceRateKey,
                security.PASSWORD_ATTEMPTS_PER_SOURCE,
                security.PASSWORD_ATTEMPT_WINDOW_SECONDS
              )
            );
          }
          const allowed = await Promise.all(checks);
          if (!allowed.every(Boolean)) {
            res.set(
              'Retry-After',
              String(security.PASSWORD_ATTEMPT_WINDOW_SECONDS)
            );
            return res.sendStatus(429);
          }
        }
        const hmac = crypto.createHmac(
          'sha256',
          Buffer.from(meta.auth, 'base64')
        );
        hmac.update(Buffer.from(meta.nonce, 'base64'));
        const verifyHash = hmac.digest();
        if (crypto.timingSafeEqual(verifyHash, Buffer.from(auth, 'base64'))) {
          if (sourceRateKey) {
            await storage.clearRateLimit(sourceRateKey);
          }
          req.nonce = crypto.randomBytes(16).toString('base64');
          await storage.setField(id, 'nonce', req.nonce);
          res.set('WWW-Authenticate', `send-v1 ${req.nonce}`);
          req.authorized = true;
          req.meta = meta;
        } else {
          res.set('WWW-Authenticate', `send-v1 ${meta.nonce}`);
          req.authorized = false;
        }
      } catch (e) {
        req.authorized = false;
      }
    }
    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  owner: async function(req, res, next) {
    const id = req.params.id;
    const ownerToken = req.body.owner_token;
    if (id && ownerToken) {
      try {
        req.meta = await storage.metadata(id);
        if (!req.meta) {
          return res.sendStatus(404);
        }
        const metaOwner = Buffer.from(req.meta.owner, 'utf8');
        const owner = Buffer.from(ownerToken, 'utf8');
        assert(metaOwner.length > 0);
        assert(metaOwner.length === owner.length);
        req.authorized = crypto.timingSafeEqual(metaOwner, owner);
      } catch (e) {
        req.authorized = false;
      }
    }
    if (req.authorized) {
      next();
    } else {
      res.sendStatus(401);
    }
  },
  fxa: async function(req, res, next) {
    const authHeader = req.header('Authorization');
    if (authHeader && /^Bearer\s/i.test(authHeader)) {
      const token = authHeader.split(' ')[1];
      req.user = await fxa.verify(token);
    }

    if (config.fxa_required && !req.user) {
      res.sendStatus(401);
    } else {
      next();
    }
  }
};
