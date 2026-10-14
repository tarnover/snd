const { Storage } = require('@google-cloud/storage');
const { pipeline } = require('stream');
const storage = new Storage();

class GCSStorage {
  constructor(config, log) {
    this.bucket = storage.bucket(config.gcs_bucket);
    this.log = log;
  }

  async length(id) {
    const data = await this.bucket.file(id).getMetadata();
    return Number(data[0].size);
  }

  getStream(id) {
    return this.bucket.file(id).createReadStream({ validation: false });
  }

  set(id, file) {
    return new Promise((resolve, reject) => {
      const destination = this.bucket.file(id).createWriteStream({
        validation: false,
        resumable: true
      });
      pipeline(file, destination, error => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  async del(id) {
    try {
      await this.bucket.file(id).delete({ ignoreNotFound: true });
    } catch (e) {
      if (e.code !== 404) {
        throw e;
      }
    }
  }

  async *list() {
    let query = { autoPaginate: false };
    while (query) {
      const [files, nextQuery] = await this.bucket.getFiles(query);
      for (const file of files) {
        const metadata = file.metadata && file.metadata.size
          ? file.metadata
          : (await file.getMetadata())[0];
        yield {
          id: file.name,
          size: Number(metadata.size),
          createdAt: new Date(metadata.timeCreated || metadata.updated).getTime()
        };
      }
      query = nextQuery || null;
    }
  }

  ping() {
    return this.bucket.exists();
  }
}

module.exports = GCSStorage;
