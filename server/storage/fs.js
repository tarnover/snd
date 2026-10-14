const fs = require('fs');
const path = require('path');
const promisify = require('util').promisify;

const stat = promisify(fs.stat);

class FSStorage {
  constructor(config, log) {
    this.log = log;
    this.dir = config.file_dir;
    fs.mkdirSync(this.dir, {
      recursive: true
    });
  }

  async length(id) {
    const result = await stat(path.join(this.dir, id));
    return result.size;
  }

  getStream(id) {
    return fs.createReadStream(path.join(this.dir, id));
  }

  set(id, file) {
    return new Promise((resolve, reject) => {
      const filepath = path.join(this.dir, id);
      const fstream = fs.createWriteStream(filepath);
      file.pipe(fstream);
      file.on('error', err => {
        fstream.destroy(err);
      });
      fstream.on('error', err => {
        fs.unlink(filepath, () => reject(err));
      });
      fstream.on('finish', resolve);
    });
  }

  async del(id) {
    try {
      await promisify(fs.unlink)(path.join(this.dir, id));
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }
  }

  async *list() {
    const dir = await fs.promises.opendir(this.dir);
    for await (const entry of dir) {
      if (!entry.isFile()) {
        continue;
      }
      const info = await fs.promises.stat(path.join(this.dir, entry.name));
      yield {
        id: entry.name,
        size: info.size,
        createdAt: info.mtimeMs
      };
    }
  }

  ping() {
    return Promise.resolve();
  }
}

module.exports = FSStorage;
