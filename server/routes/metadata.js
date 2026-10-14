const storage = require('../storage');

module.exports = async function(req, res) {
  const id = req.params.id;
  const meta = req.meta;
  try {
    const [ttl, size] = await Promise.all([storage.ttl(id), storage.length(id)]);
    res.send({
      metadata: meta.metadata,
      size,
      finalDownload: meta.dl + 1 === meta.dlimit,
      ttl
    });
  } catch (e) {
    res.sendStatus(404);
  }
};
