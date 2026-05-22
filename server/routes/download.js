const storage = require('../storage');
const mozlog = require('../log');
const log = mozlog('send.download');

module.exports = async function(req, res) {
  const id = req.params.id;
  let claimed = false;
  try {
    const meta = req.meta;
    const dlimit = meta.dlimit;
    // Atomically claim a download slot before any work, so concurrent
    // requests with the same Authorization header cannot exceed dlimit.
    const newDl = await storage.incrementField(id, 'dl');
    claimed = true;
    if (newDl > dlimit) {
      await storage.incrementField(id, 'dl', -1);
      claimed = false;
      return res.sendStatus(404);
    }

    const contentLength = await storage.length(id);
    const fileStream = await storage.get(id);
    let cancelled = false;

    req.on('aborted', () => {
      cancelled = true;
      fileStream.destroy();
    });

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Length': contentLength
    });
    fileStream
      .pipe(res)
      .on('finish', async () => {
        if (cancelled) {
          try {
            await storage.incrementField(id, 'dl', -1);
          } catch (e) {
            log.info('StorageError:', id);
          }
          return;
        }
        try {
          if (newDl >= dlimit) {
            await storage.del(id);
          }
        } catch (e) {
          log.info('StorageError:', id);
        }
      })
      .on('error', async () => {
        try {
          await storage.incrementField(id, 'dl', -1);
        } catch (e) {
          log.info('StorageError:', id);
        }
      });
  } catch (e) {
    if (claimed) {
      try {
        await storage.incrementField(id, 'dl', -1);
      } catch (err) {
        log.info('StorageError:', id);
      }
    }
    res.sendStatus(404);
  }
};
