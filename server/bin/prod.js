process.env.NODE_ENV = process.env.NODE_ENV || 'production';

const express = require('express');
const path = require('path');
const config = require('../config');
const routes = require('../routes');
const pages = require('../routes/pages');
const configureWebSockets = require('../websocket');

const app = express();

configureWebSockets(app, {
  perMessageDeflate: false,
  maxPayload: require('../security').WS_MAX_PAYLOAD_BYTES,
  maxConnections: require('../security').WS_MAX_CONNECTIONS
});
routes(app);
app.ws('/api/ws', require('../routes/ws'));

app.use(
  express.static(path.resolve(__dirname, '../../dist/'), {
    setHeaders: function(res, path) {
      if (!/serviceWorker\.js$/.test(path)) {
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
      }
      res.removeHeader('Pragma');
    }
  })
);

app.use(pages.notfound);

app.listen(config.listen_port, config.listen_address);
