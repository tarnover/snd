const assert = require('assert');
const { PassThrough, Writable } = require('stream');
const proxyquire = require('proxyquire').noCallThru();

class Sink extends Writable {
  _write(chunk, encoding, callback) {
    callback();
  }
}

describe('GCS storage', function() {
  it('rejects and destroys the destination when the source errors', async function() {
    this.timeout(10000);
    const destination = new Sink();
    const file = {
      createWriteStream() {
        return destination;
      }
    };
    const GCSStorage = proxyquire('../../server/storage/gcs', {
      '@google-cloud/storage': {
        Storage: class {
          bucket() {
            return { file: () => file };
          }
        }
      }
    });
    const storage = new GCSStorage({ gcs_bucket: 'test' });
    const source = new PassThrough();
    const upload = storage.set('blob', source);
    source.destroy(new Error('source failed'));
    await assert.rejects(upload, /source failed/);
    assert.equal(destination.destroyed, true);
  });
});
