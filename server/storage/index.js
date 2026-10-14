const crypto = require('crypto');
const config = require('../config');
const Metadata = require('../metadata');
const mozlog = require('../log');
const createRedisClient = require('./redis');
const security = require('../security');

const EXPIRATIONS_KEY = 'send:blob-expirations';
const BLOB_BYTES_KEY = 'send:blob-bytes';
const UPLOAD_LEASES_KEY = 'send:upload-leases';
const STORAGE_BYTES_KEY = 'send:storage-bytes';
const STORAGE_COUNT_KEY = 'send:storage-count';

const RESERVE_SCRIPT = `
local used = tonumber(redis.call('GET', KEYS[1]) or '0')
local count = tonumber(redis.call('GET', KEYS[2]) or '0')
local reservation = tonumber(ARGV[3])
if used + reservation > tonumber(ARGV[5]) or count + 1 > tonumber(ARGV[6]) then
  return {0, used, count}
end
redis.call('INCRBY', KEYS[1], reservation)
redis.call('INCR', KEYS[2])
redis.call('HSET', KEYS[3], ARGV[1], reservation)
redis.call('HSET', KEYS[4], ARGV[1], ARGV[2])
redis.call('ZADD', KEYS[5], ARGV[4], ARGV[1])
return {1, used + reservation, count + 1}
`;

const FINALIZE_SCRIPT = `
if redis.call('HGET', KEYS[3], ARGV[1]) ~= ARGV[2] then
  return {0, ''}
end
local oldPath = redis.call('HGET', KEYS[5], 'blob') or ARGV[7] or ''
redis.call('HDEL', KEYS[3], ARGV[1])
redis.call('INCRBY', KEYS[1], tonumber(ARGV[4]) - tonumber(ARGV[3]))
redis.call('HSET', KEYS[2], ARGV[1], ARGV[4])
redis.call('ZADD', KEYS[4], ARGV[5], ARGV[1])
for i = 8, #ARGV, 2 do
  redis.call('HSET', KEYS[5], ARGV[i], ARGV[i + 1])
end
redis.call('EXPIRE', KEYS[5], ARGV[6])
return {1, oldPath}
`;

const RELEASE_SCRIPT = `
local bytes = redis.call('HGET', KEYS[3], ARGV[1])
redis.call('HDEL', KEYS[4], ARGV[1])
redis.call('ZREM', KEYS[5], ARGV[1])
if not bytes then
  return 0
end
redis.call('HDEL', KEYS[3], ARGV[1])
local used = redis.call('INCRBY', KEYS[1], -tonumber(bytes))
local count = redis.call('DECR', KEYS[2])
if used < 0 then redis.call('SET', KEYS[1], 0) end
if count < 0 then redis.call('SET', KEYS[2], 0) end
return 1
`;

const ABORT_SCRIPT = `
if redis.call('HGET', KEYS[4], ARGV[1]) ~= ARGV[2] then
  return 0
end
local bytes = tonumber(redis.call('HGET', KEYS[3], ARGV[1]) or '0')
redis.call('HDEL', KEYS[4], ARGV[1])
redis.call('HDEL', KEYS[3], ARGV[1])
redis.call('ZREM', KEYS[5], ARGV[1])
local used = redis.call('INCRBY', KEYS[1], -bytes)
local count = redis.call('DECR', KEYS[2])
if used < 0 then redis.call('SET', KEYS[1], 0) end
if count < 0 then redis.call('SET', KEYS[2], 0) end
return 1
`;

const CLAIM_EXPIRED_SCRIPT = `
local score = tonumber(redis.call('ZSCORE', KEYS[2], ARGV[1]) or '0')
if score == 0 or score > tonumber(ARGV[2]) then
  return 0
end
redis.call('HDEL', KEYS[1], ARGV[1])
redis.call('ZADD', KEYS[2], ARGV[3], ARGV[1])
return 1
`;

const BACKFILL_SCRIPT = `
if redis.call('HEXISTS', KEYS[3], ARGV[1]) == 1 then
  return 0
end
redis.call('INCRBY', KEYS[1], ARGV[2])
redis.call('INCR', KEYS[2])
redis.call('HSET', KEYS[3], ARGV[1], ARGV[2])
redis.call('ZADD', KEYS[4], ARGV[3], ARGV[1])
return 1
`;

function getPrefix(seconds) {
  return Math.max(Math.floor(seconds / 86400), 1);
}

class DB {
  constructor(settings) {
    let Storage = null;
    if (settings.s3_bucket) {
      Storage = require('./s3');
    } else if (settings.gcs_bucket) {
      Storage = require('./gcs');
    } else {
      Storage = require('./fs');
    }
    this.log = mozlog('send.storage');
    this.storage = new Storage(settings, this.log);
    this.redis = createRedisClient(settings);
    this.redis.on('error', err => {
      this.log.error('Redis:', err);
    });

    this.cleanupTimer = setInterval(() => {
      this.cleanupExpired().catch(err => this.log.error('Cleanup:', err));
    }, security.STORAGE_CLEANUP_INTERVAL_MS);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
    this.reconcilePromise = this.reconcileExistingBlobs()
      .then(() => this.cleanupExpired())
      .catch(err => this.log.error('Reconcile:', err));
  }

  async ttl(id) {
    const result = await this.redis.ttlAsync(id);
    return Math.ceil(result) * 1000;
  }

  async getFilePath(id) {
    const blob = await this.redis.hgetAsync(id, 'blob');
    if (blob) {
      return blob;
    }
    const prefix = await this.redis.hgetAsync(id, 'prefix');
    if (!prefix) {
      const err = new Error('not found');
      err.code = 'ENOENT';
      throw err;
    }
    return `${prefix}-${id}`;
  }

  getPrefixedId(id) {
    return this.getFilePath(id);
  }

  async length(id) {
    return this.storage.length(await this.getFilePath(id));
  }

  async get(id) {
    return this.storage.getStream(await this.getFilePath(id));
  }

  async reserveUpload(filePath, token, reservation, pendingExpiry) {
    if (this.redis.evalAsync) {
      const result = await this.redis.evalAsync(
        RESERVE_SCRIPT,
        5,
        STORAGE_BYTES_KEY,
        STORAGE_COUNT_KEY,
        BLOB_BYTES_KEY,
        UPLOAD_LEASES_KEY,
        EXPIRATIONS_KEY,
        filePath,
        token,
        reservation,
        pendingExpiry,
        security.MAX_STORAGE_BYTES,
        security.MAX_STORED_BLOBS
      );
      return Number(result[0]) === 1;
    }

    const used = Number((await this.redis.getAsync(STORAGE_BYTES_KEY)) || 0);
    const count = Number((await this.redis.getAsync(STORAGE_COUNT_KEY)) || 0);
    if (
      used + reservation > security.MAX_STORAGE_BYTES ||
      count + 1 > security.MAX_STORED_BLOBS
    ) {
      return false;
    }
    await this.redis.execMultiAsync([
      ['incrby', STORAGE_BYTES_KEY, reservation],
      ['incr', STORAGE_COUNT_KEY],
      ['hset', BLOB_BYTES_KEY, filePath, reservation],
      ['hset', UPLOAD_LEASES_KEY, filePath, token],
      ['zadd', EXPIRATIONS_KEY, pendingExpiry, filePath]
    ]);
    return true;
  }

  async finalizeUpload(
    id,
    filePath,
    token,
    reservation,
    chargedBytes,
    expiresAt,
    expireSeconds,
    oldFallback,
    storedMeta
  ) {
    const metadataArgs = Object.entries(storedMeta).reduce(
      (args, [key, value]) => args.concat(key, value),
      []
    );
    if (this.redis.evalAsync) {
      const result = await this.redis.evalAsync(
        FINALIZE_SCRIPT,
        5,
        STORAGE_BYTES_KEY,
        BLOB_BYTES_KEY,
        UPLOAD_LEASES_KEY,
        EXPIRATIONS_KEY,
        id,
        filePath,
        token,
        reservation,
        chargedBytes,
        expiresAt,
        expireSeconds,
        oldFallback || '',
        ...metadataArgs
      );
      return {
        finalized: Number(result[0]) === 1,
        oldPath: String(result[1] || '')
      };
    }

    const lease = await this.redis.hgetAsync(UPLOAD_LEASES_KEY, filePath);
    if (lease !== token) {
      return { finalized: false, oldPath: '' };
    }
    const oldPath =
      (await this.redis.hgetAsync(id, 'blob')) || oldFallback || '';
    await this.redis.execMultiAsync([
      ['hdel', UPLOAD_LEASES_KEY, filePath],
      ['incrby', STORAGE_BYTES_KEY, chargedBytes - reservation],
      ['hset', BLOB_BYTES_KEY, filePath, chargedBytes],
      ['zadd', EXPIRATIONS_KEY, expiresAt, filePath],
      ['hmset', id, ...metadataArgs],
      ['expire', id, expireSeconds]
    ]);
    return { finalized: true, oldPath };
  }

  async abortUpload(filePath, token) {
    if (this.redis.evalAsync) {
      return this.redis.evalAsync(
        ABORT_SCRIPT,
        5,
        STORAGE_BYTES_KEY,
        STORAGE_COUNT_KEY,
        BLOB_BYTES_KEY,
        UPLOAD_LEASES_KEY,
        EXPIRATIONS_KEY,
        filePath,
        token
      );
    }
    const lease = await this.redis.hgetAsync(UPLOAD_LEASES_KEY, filePath);
    if (lease !== token) {
      return 0;
    }
    return this.releaseBlob(filePath);
  }

  async set(id, file, meta, expireSeconds = config.default_expire_seconds) {
    const prefix = getPrefix(expireSeconds);
    const generation = crypto.randomBytes(8).toString('hex');
    const filePath = `${prefix}-${id}-${generation}`;
    const token = crypto.randomBytes(16).toString('hex');
    const reservation = security.MAX_ENCRYPTED_FILE_SIZE;
    const pendingExpiry =
      Date.now() + security.UPLOAD_RESERVATION_SECONDS * 1000;
    let oldFallback = '';
    try {
      oldFallback = await this.getFilePath(id);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }

    const reserved = await this.reserveUpload(
      filePath,
      token,
      reservation,
      pendingExpiry
    );
    if (!reserved) {
      const err = new Error('quota');
      err.code = 'EQUOTA';
      throw err;
    }

    let finalized = false;
    try {
      await this.storage.set(filePath, file);
      const bytes = Number(await this.storage.length(filePath));
      if (
        !Number.isSafeInteger(bytes) ||
        bytes < 0 ||
        bytes > security.MAX_ENCRYPTED_FILE_SIZE
      ) {
        throw new Error('limit');
      }
      const chargedBytes = Math.max(
        bytes,
        security.MIN_STORAGE_BYTES_PER_BLOB
      );
      const expiresAt = Date.now() + expireSeconds * 1000;
      const storedMeta = Object.assign({}, meta, {
        prefix,
        blob: filePath,
        bytes
      });
      const result = await this.finalizeUpload(
        id,
        filePath,
        token,
        reservation,
        chargedBytes,
        expiresAt,
        expireSeconds,
        oldFallback,
        storedMeta
      );
      if (!result.finalized) {
        const err = new Error('upload lease expired');
        err.code = 'ELEASE';
        throw err;
      }
      finalized = true;

      if (result.oldPath && result.oldPath !== filePath) {
        try {
          await this.storage.del(result.oldPath);
          await this.releaseBlob(result.oldPath);
        } catch (e) {
          await this.redis.zaddAsync(
            EXPIRATIONS_KEY,
            Date.now(),
            result.oldPath
          );
          this.log.error('Cleanup:', e);
        }
      }
    } catch (e) {
      if (!finalized) {
        try {
          await this.storage.del(filePath);
        } catch (deleteError) {
          this.log.error('Cleanup:', deleteError);
        }
        await this.abortUpload(filePath, token);
      }
      throw e;
    }
  }

  setField(id, key, value) {
    return this.redis.hsetAsync(id, key, value);
  }

  setFields(id, fields) {
    return this.redis.hmsetAsync(id, fields);
  }

  incrementField(id, key, increment = 1) {
    return this.redis.hincrbyAsync(id, key, increment);
  }

  async del(id) {
    const filePath = await this.getFilePath(id);
    await this.storage.del(filePath);
    await this.releaseBlob(filePath);
    await this.redis.delAsync(id);
  }

  async releaseBlob(filePath) {
    if (this.redis.evalAsync) {
      return this.redis.evalAsync(
        RELEASE_SCRIPT,
        5,
        STORAGE_BYTES_KEY,
        STORAGE_COUNT_KEY,
        BLOB_BYTES_KEY,
        UPLOAD_LEASES_KEY,
        EXPIRATIONS_KEY,
        filePath
      );
    }
    const bytes = Number(
      (await this.redis.hgetAsync(BLOB_BYTES_KEY, filePath)) || 0
    );
    const result = await this.redis.execMultiAsync([
      ['zrem', EXPIRATIONS_KEY, filePath],
      ['hdel', UPLOAD_LEASES_KEY, filePath],
      ['hdel', BLOB_BYTES_KEY, filePath]
    ]);
    if (Number(result[2]) === 1) {
      await this.redis.execMultiAsync([
        ['decrby', STORAGE_BYTES_KEY, bytes],
        ['decr', STORAGE_COUNT_KEY]
      ]);
      return 1;
    }
    return 0;
  }

  async claimExpired(filePath, now) {
    const retryAt = now + security.STORAGE_CLEANUP_INTERVAL_MS;
    if (this.redis.evalAsync) {
      return Number(
        await this.redis.evalAsync(
          CLAIM_EXPIRED_SCRIPT,
          2,
          UPLOAD_LEASES_KEY,
          EXPIRATIONS_KEY,
          filePath,
          now,
          retryAt
        )
      );
    }
    const score = Number(
      (await this.redis.zscoreAsync(EXPIRATIONS_KEY, filePath)) || 0
    );
    if (!score || score > now) {
      return 0;
    }
    await this.redis.execMultiAsync([
      ['hdel', UPLOAD_LEASES_KEY, filePath],
      ['zadd', EXPIRATIONS_KEY, retryAt, filePath]
    ]);
    return 1;
  }

  async backfillBlob(filePath, chargedBytes, expiresAt) {
    if (this.redis.evalAsync) {
      return this.redis.evalAsync(
        BACKFILL_SCRIPT,
        4,
        STORAGE_BYTES_KEY,
        STORAGE_COUNT_KEY,
        BLOB_BYTES_KEY,
        EXPIRATIONS_KEY,
        filePath,
        chargedBytes,
        expiresAt
      );
    }
    if (await this.redis.hgetAsync(BLOB_BYTES_KEY, filePath)) {
      return 0;
    }
    await this.redis.execMultiAsync([
      ['incrby', STORAGE_BYTES_KEY, chargedBytes],
      ['incr', STORAGE_COUNT_KEY],
      ['hset', BLOB_BYTES_KEY, filePath, chargedBytes],
      ['zadd', EXPIRATIONS_KEY, expiresAt, filePath]
    ]);
    return 1;
  }

  async reconcileExistingBlobs() {
    if (typeof this.storage.list !== 'function') {
      return 0;
    }
    let added = 0;
    for await (const blob of this.storage.list()) {
      const match = /^(\d+)-(.+)$/.exec(blob.id);
      if (!match || !Number.isFinite(blob.createdAt)) {
        continue;
      }
      const days = Math.max(Number(match[1]), 1);
      const legacyId = match[2];
      const ttl = await this.redis.ttlAsync(legacyId);
      const expiresAt =
        ttl > 0
          ? Date.now() + ttl * 1000
          : blob.createdAt + days * 24 * 60 * 60 * 1000;
      const chargedBytes = Math.max(
        Number(blob.size) || 0,
        security.MIN_STORAGE_BYTES_PER_BLOB
      );
      added += Number(
        await this.backfillBlob(blob.id, chargedBytes, expiresAt)
      );
    }
    return added;
  }

  async cleanupExpired(now = Date.now()) {
    const expired = this.redis.isMock
      ? await this.redis.zrangebyscoreAsync(EXPIRATIONS_KEY, 0, now)
      : await this.redis.zrangebyscoreAsync(
          EXPIRATIONS_KEY,
          0,
          now,
          'LIMIT',
          0,
          security.STORAGE_CLEANUP_BATCH_SIZE
        );
    const paths = expired.slice(0, security.STORAGE_CLEANUP_BATCH_SIZE);
    let deleted = 0;
    for (const filePath of paths) {
      if (!(await this.claimExpired(filePath, now))) {
        continue;
      }
      try {
        await this.storage.del(filePath);
        await this.releaseBlob(filePath);
        deleted++;
      } catch (e) {
        this.log.error('Cleanup:', e);
      }
    }
    return deleted;
  }

  async claimRateLimit(key, limit, windowSeconds) {
    const result = await this.redis.execMultiAsync([
      ['incr', key],
      ['expire', key, windowSeconds]
    ]);
    return Number(result[0]) <= limit;
  }

  clearRateLimit(keys) {
    return this.redis.delAsync(keys);
  }

  async ping() {
    await this.reconcilePromise;
    await this.redis.pingAsync();
    await this.storage.ping();
  }

  async metadata(id) {
    const result = await this.redis.hgetallAsync(id);
    return result && new Metadata(result);
  }
}

module.exports = new DB(config);
