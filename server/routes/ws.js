const crypto = require('crypto');
const { Transform } = require('stream');
const storage = require('../storage');
const config = require('../config');
const mozlog = require('../log');
const Limiter = require('../limiter');
const fxa = require('../fxa');
const security = require('../security');
const claimUpload = require('../uploadLimit');

const log = mozlog('send.upload');

function logError(event, error) {
  log.error(event, {
    message: error && error.message ? error.message : String(error)
  });
}

function safeSend(ws, message) {
  if (ws.readyState === 1) {
    try {
      ws.send(JSON.stringify(message));
    } catch (e) {
      logError('ws.send', e);
    }
  }
}

module.exports = function(ws, req) {
  let fileStream;
  let wsStream;
  let eof;
  let idleTimer;
  let totalTimer;
  let completed = false;
  let firstMessageTimer;

  const clearTimers = () => {
    clearTimeout(firstMessageTimer);
    clearTimeout(idleTimer);
    clearTimeout(totalTimer);
  };
  const destroyStreams = error => {
    for (const stream of [wsStream, eof, fileStream]) {
      if (stream && !stream.destroyed) {
        stream.destroy(error);
      }
    }
  };
  const abort = (status, error) => {
    clearTimers();
    destroyStreams(error || new Error('upload aborted'));
    safeSend(ws, { error: status });
    if (ws.readyState === 0 || ws.readyState === 1) {
      ws.close();
    }
  };

  ws.on('error', error => {
    logError('ws.error', error);
    clearTimers();
    destroyStreams(error);
  });

  firstMessageTimer = setTimeout(
    () => abort(408, new Error('initial message timeout')),
    security.WS_FIRST_MESSAGE_TIMEOUT_MS
  );

  ws.on('close', code => {
    clearTimers();
    if (!completed || code !== 1000) {
      destroyStreams(new Error('socket closed'));
    }
  });

  ws.once('message', async function(message, isBinary) {
    clearTimeout(firstMessageTimer);
    try {
      const messageBytes = Buffer.isBuffer(message)
        ? message.length
        : Buffer.byteLength(String(message));
      if (isBinary || messageBytes > security.WS_MAX_CONTROL_BYTES) {
        return abort(400, new Error('invalid initial message'));
      }

      const fileInfo = JSON.parse(String(message));
      if (
        !fileInfo ||
        typeof fileInfo !== 'object' ||
        Array.isArray(fileInfo)
      ) {
        return abort(400, new Error('invalid initial message'));
      }

      const timeLimit =
        fileInfo.timeLimit == null
          ? config.default_expire_seconds
          : fileInfo.timeLimit;
      const dlimit =
        fileInfo.dlimit == null
          ? config.default_downloads
          : fileInfo.dlimit;
      const metadata = fileInfo.fileMetadata;
      const auth = fileInfo.authorization;
      const bearer = fileInfo.bearer;

      if (
        typeof metadata !== 'string' ||
        metadata.length === 0 ||
        Buffer.byteLength(metadata) > security.WS_MAX_METADATA_BYTES ||
        typeof auth !== 'string' ||
        auth.length > 256 ||
        (bearer != null &&
          (typeof bearer !== 'string' || bearer.length > 8192)) ||
        !Number.isInteger(timeLimit) ||
        timeLimit <= 0 ||
        timeLimit > config.max_expire_seconds ||
        !Number.isInteger(dlimit) ||
        dlimit < 1 ||
        dlimit > config.max_downloads
      ) {
        log.error('ws.params', {
          hasMetadata: !!metadata,
          hasAuth: !!auth,
          timeLimit,
          dlimit
        });
        return abort(400, new Error('invalid upload parameters'));
      }

      const authParts = auth.split(' ');
      if (
        authParts.length !== 2 ||
        authParts[0] !== 'send-v1' ||
        !/^[A-Za-z0-9+/_-]+={0,2}$/.test(authParts[1])
      ) {
        log.error('ws.authFormat', { scheme: authParts[0] });
        return abort(400, new Error('invalid authorization'));
      }

      const user = await fxa.verify(bearer);
      if (config.fxa_required && !user) {
        return abort(401, new Error('account required'));
      }
      if (!(await claimUpload(req))) {
        return abort(429, new Error('upload rate exceeded'));
      }

      const newId = crypto.randomBytes(8).toString('hex');
      const owner = crypto.randomBytes(10).toString('hex');
      const meta = {
        owner,
        metadata,
        dlimit,
        auth: authParts[1],
        nonce: crypto.randomBytes(16).toString('base64')
      };
      const url = `${config.deriveBaseUrl(req)}/dl/${newId}/`;

      safeSend(ws, {
        url,
        ownerToken: meta.owner,
        id: newId
      });

      const resetIdleTimer = () => {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(
          () => abort(408, new Error('upload idle timeout')),
          security.WS_IDLE_TIMEOUT_MS
        );
      };
      ws.on('message', resetIdleTimer);
      resetIdleTimer();
      totalTimer = setTimeout(
        () => abort(408, new Error('upload duration exceeded')),
        security.WS_MAX_DURATION_MS
      );

      fileStream = new Limiter(security.MAX_ENCRYPTED_FILE_SIZE);
      eof = new Transform({
        transform(chunk, encoding, callback) {
          if (chunk.length === 1 && chunk[0] === 0) {
            this.push(null);
          } else {
            this.push(chunk);
          }
          callback();
        }
      });
      wsStream = ws.constructor.createWebSocketStream(ws);

      const streamError = error => destroyStreams(error);
      wsStream.on('error', streamError);
      eof.on('error', streamError);
      fileStream.on('error', () => {});
      wsStream.pipe(eof).pipe(fileStream);

      await storage.set(newId, fileStream, meta, timeLimit);
      completed = true;
      clearTimers();
      safeSend(ws, { ok: true });
    } catch (e) {
      logError('upload', e);
      const status =
        e.message === 'limit' ? 413 : e.code === 'EQUOTA' ? 429 : 500;
      safeSend(ws, { error: status });
    }
    if (ws.readyState === 0 || ws.readyState === 1) {
      ws.close();
    }
  });
};
