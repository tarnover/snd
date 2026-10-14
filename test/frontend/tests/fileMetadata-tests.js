/* global LIMITS */
import assert from 'assert';
import { encryptedSize } from '../../../app/utils';
import { validateFileMetadata } from '../../../app/fileMetadata';

function validMetadata() {
  return {
    name: 'archive.zip',
    size: 3,
    type: 'send-archive',
    manifest: {
      files: [
        { name: 'a.txt', size: 1, type: 'text/plain' },
        { name: 'b.txt', size: 2, type: 'text/plain' }
      ]
    }
  };
}

describe('File metadata validation', function() {
  it('accepts metadata matching the stored ciphertext', function() {
    const meta = validMetadata();
    assert.equal(
      validateFileMetadata(meta, encryptedSize(meta.size), LIMITS),
      meta
    );
  });

  it('rejects a forged allocation size', function() {
    const meta = validMetadata();
    meta.size = LIMITS.MAX_FILE_SIZE;
    assert.throws(() =>
      validateFileMetadata(meta, encryptedSize(3), LIMITS)
    );
  });

  it('rejects archive totals that do not match the file size', function() {
    const meta = validMetadata();
    meta.manifest.files[0].size = 2;
    assert.throws(() =>
      validateFileMetadata(meta, encryptedSize(meta.size), LIMITS)
    );
  });

  it('rejects control characters and paths in file names', function() {
    const meta = validMetadata();
    meta.name = 'bad\nname.zip';
    assert.throws(() =>
      validateFileMetadata(meta, encryptedSize(meta.size), LIMITS)
    );

    meta.name = 'archive.zip';
    meta.manifest.files[0].name = '../a.txt';
    assert.throws(() =>
      validateFileMetadata(meta, encryptedSize(meta.size), LIMITS)
    );
  });
});
