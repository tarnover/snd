const assert = require('assert');
const proxyquire = require('proxyquire').noCallThru();
const security = require('../../server/security');

const stream = {};
class MockStorage {
  length() {
    return Promise.resolve(12);
  }
  getStream() {
    return stream;
  }
  set() {
    return Promise.resolve();
  }
  del() {
    return Promise.resolve();
  }
  ping() {
    return Promise.resolve();
  }
}

const config = {
  s3_bucket: 'foo',
  default_expire_seconds: 20,
  expire_times_seconds: [10, 20, 30],
  env: 'development',
  redis_host: 'localhost'
};

const storage = proxyquire('../../server/storage', {
  '../config': config,
  '../log': () => {},
  './s3': MockStorage
});

describe('Storage', function() {
  describe('ttl', function() {
    it('returns milliseconds remaining', async function() {
      const time = 40;
      await storage.set('x', null, { foo: 'bar' }, time);
      const ms = await storage.ttl('x');
      await storage.del('x');
      assert.equal(ms, time * 1000);
    });
  });

  describe('length', function() {
    it('returns the file size', async function() {
      await storage.set('length-test', null);
      const len = await storage.length('length-test');
      assert.equal(len, 12);
      await storage.del('length-test');
    });
  });

  describe('get', function() {
    it('returns a stream', async function() {
      await storage.set('get-test', null);
      const s = await storage.get('get-test');
      assert.equal(s, stream);
      await storage.del('get-test');
    });
  });

  describe('set', function() {
    it('sets expiration to expire time', async function() {
      const seconds = 100;
      await storage.set('x', null, { foo: 'bar' }, seconds);
      const s = await storage.redis.ttlAsync('x');
      await storage.del('x');
      assert.equal(Math.ceil(s), seconds);
    });

    it('adds right prefix based on expire time', async function() {
      await storage.set('x', null, { foo: 'bar' }, 300);
      const path_x = await storage.getPrefixedId('x');
      assert.match(path_x, /^1-x-[0-9a-f]{16}$/);
      await storage.del('x');

      await storage.set('y', null, { foo: 'bar' }, 86400);
      const path_y = await storage.getPrefixedId('y');
      assert.match(path_y, /^1-y-[0-9a-f]{16}$/);
      await storage.del('y');

      await storage.set('z', null, { foo: 'bar' }, 86400 * 7);
      const path_z = await storage.getPrefixedId('z');
      assert.match(path_z, /^7-z-[0-9a-f]{16}$/);
      await storage.del('z');
    });

    it('sets metadata', async function() {
      const m = { foo: 'bar' };
      await storage.set('x', null, m);
      const meta = await storage.redis.hgetallAsync('x');
      delete meta.prefix;
      delete meta.bytes;
      delete meta.blob;
      await storage.del('x');
      assert.deepEqual(meta, m);
    });

    it('rejects an upload before storage when the byte budget is full', async function() {
      await storage.redis.delAsync('send:storage-bytes');
      await storage.redis.incrbyAsync(
        'send:storage-bytes',
        security.MAX_STORAGE_BYTES
      );
      try {
        await assert.rejects(storage.set('over-quota', null), {
          code: 'EQUOTA'
        });
      } finally {
        await storage.redis.delAsync('send:storage-bytes');
      }
    });

    it('rejects an upload when the object-count budget is full', async function() {
      await storage.redis.delAsync('send:storage-count');
      await storage.redis.incrbyAsync(
        'send:storage-count',
        security.MAX_STORED_BLOBS
      );
      try {
        await assert.rejects(storage.set('over-count', null), {
          code: 'EQUOTA'
        });
      } finally {
        await storage.redis.delAsync('send:storage-count');
      }
    });

    it('charges a minimum amount for empty objects', async function() {
      const originalLength = storage.storage.length;
      storage.storage.length = () => Promise.resolve(0);
      try {
        await storage.set('tiny', null);
        assert.equal(
          Number(await storage.redis.getAsync('send:storage-bytes')),
          security.MIN_STORAGE_BYTES_PER_BLOB
        );
        assert.equal(
          Number(await storage.redis.getAsync('send:storage-count')),
          1
        );
        await storage.del('tiny');
      } finally {
        storage.storage.length = originalLength;
      }
    });

    it('does not double count a replacement', async function() {
      await storage.set('replace', null);
      await storage.set('replace', null);
      assert.equal(
        Number(await storage.redis.getAsync('send:storage-bytes')),
        security.MIN_STORAGE_BYTES_PER_BLOB
      );
      assert.equal(
        Number(await storage.redis.getAsync('send:storage-count')),
        1
      );
      await storage.del('replace');
    });

    it('cannot finalize after its upload lease is cleaned up', async function() {
      const originalSet = storage.storage.set;
      let finishUpload;
      let markStarted;
      const started = new Promise(resolve => {
        markStarted = resolve;
      });
      storage.storage.set = () => {
        markStarted();
        return new Promise(resolve => {
          finishUpload = resolve;
        });
      };

      try {
        const upload = storage.set('expired-lease', null);
        await started;
        await storage.cleanupExpired(
          Date.now() + security.UPLOAD_RESERVATION_SECONDS * 1000 + 1
        );
        finishUpload();
        await assert.rejects(upload, { code: 'ELEASE' });
        assert.equal(
          Number((await storage.redis.getAsync('send:storage-bytes')) || 0),
          0
        );
        assert.equal(
          Number((await storage.redis.getAsync('send:storage-count')) || 0),
          0
        );
      } finally {
        storage.storage.set = originalSet;
      }
    });
  });

  describe('setField', function() {
    it('works', async function() {
      await storage.set('x', null);
      storage.setField('x', 'y', 'z');
      const z = await storage.redis.hgetAsync('x', 'y');
      assert.equal(z, 'z');
      await storage.del('x');
    });
  });

  describe('cleanupExpired', function() {
    it('removes expired blobs from the backing store', async function() {
      await storage.set('expired', null, { foo: 'bar' });
      const filePath = await storage.getPrefixedId('expired');
      await storage.redis.zaddAsync(
        'send:blob-expirations',
        Date.now() - 1,
        filePath
      );
      const deleted = await storage.cleanupExpired();
      assert.equal(deleted, 1);
      const scheduled = await storage.redis.zrangebyscoreAsync(
        'send:blob-expirations',
        0,
        Date.now()
      );
      assert.deepEqual(scheduled, []);
    });

    it('accounts for and removes a discovered legacy blob', async function() {
      const path = '1-legacy';
      await storage.backfillBlob(
        path,
        security.MIN_STORAGE_BYTES_PER_BLOB,
        Date.now() - 1
      );
      assert.equal(
        Number(await storage.redis.getAsync('send:storage-count')),
        1
      );
      await storage.cleanupExpired();
      assert.equal(
        Number(await storage.redis.getAsync('send:storage-count')),
        0
      );
    });
  });

  describe('del', function() {
    it('works', async function() {
      await storage.set('x', null, { foo: 'bar' });
      await storage.del('x');
      const meta = await storage.metadata('x');
      assert.equal(meta, null);
    });
  });

  describe('ping', function() {
    it('works', async function() {
      await storage.ping();
    });
  });

  describe('metadata', function() {
    it('returns all metadata fields', async function() {
      const m = {
        pwd: true,
        dl: 1,
        dlimit: 1,
        auth: 'foo',
        metadata: 'bar',
        nonce: 'baz',
        owner: 'bmo'
      };
      await storage.set('x', null, m);
      const meta = await storage.metadata('x');
      assert.deepEqual(meta, m);
    });
  });
});
