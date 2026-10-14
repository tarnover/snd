const storage = require('../storage');

module.exports = async function(req, res) {
  const id = req.params.id;
  const auth = req.body.auth;
  if (!auth) {
    return res.sendStatus(400);
  }

  try {
    await storage.setFields(id, { auth, pwd: true });
    res.sendStatus(200);
  } catch (e) {
    return res.sendStatus(404);
  }
};
