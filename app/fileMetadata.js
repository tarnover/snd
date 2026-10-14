import { encryptedSize } from './utils';

const MAX_NAME_BYTES = 1024;
const MAX_TYPE_BYTES = 255;
const encoder = new TextEncoder();

function validString(value, maxBytes) {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    !hasControlCharacter(value) &&
    encoder.encode(value).byteLength <= maxBytes
  );
}

function hasControlCharacter(value) {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 32 || code === 127) {
      return true;
    }
  }
  return false;
}

function validEntryName(value) {
  return (
    validString(value, MAX_NAME_BYTES) &&
    value !== '.' &&
    value !== '..' &&
    !value.includes('/') &&
    !value.includes('\\')
  );
}

function validSize(value, maximum) {
  return Number.isSafeInteger(value) && value >= 0 && value <= maximum;
}

export function validateFileMetadata(meta, ciphertextSize, limits) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new Error('invalid file metadata');
  }
  if (!validSize(meta.size, limits.MAX_FILE_SIZE)) {
    throw new Error('invalid file size');
  }
  if (
    !Number.isSafeInteger(ciphertextSize) ||
    ciphertextSize !== encryptedSize(meta.size)
  ) {
    throw new Error('file size does not match ciphertext');
  }
  if (!validString(meta.name, MAX_NAME_BYTES)) {
    throw new Error('invalid file name');
  }
  if (!validString(meta.type, MAX_TYPE_BYTES)) {
    throw new Error('invalid file type');
  }

  const manifest = meta.manifest;
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new Error('invalid file manifest');
  }
  if (meta.type === 'send-archive') {
    if (
      !Array.isArray(manifest.files) ||
      manifest.files.length < 2 ||
      manifest.files.length > limits.MAX_FILES_PER_ARCHIVE
    ) {
      throw new Error('invalid archive manifest');
    }
    let total = 0;
    for (const file of manifest.files) {
      if (
        !file ||
        typeof file !== 'object' ||
        Array.isArray(file) ||
        !validEntryName(file.name) ||
        !validSize(file.size, limits.MAX_FILE_SIZE) ||
        (file.type !== undefined &&
          !validString(file.type, MAX_TYPE_BYTES))
      ) {
        throw new Error('invalid archive entry');
      }
      total += file.size;
      if (!Number.isSafeInteger(total) || total > limits.MAX_FILE_SIZE) {
        throw new Error('invalid archive size');
      }
    }
    if (total !== meta.size) {
      throw new Error('archive size does not match manifest');
    }
  }

  return meta;
}
