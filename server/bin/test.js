const assets = require('../../common/assets');
const routes = require('../routes');
const pages = require('../routes/pages');
const tests = require('../../test/frontend/routes');
const configureWebSockets = require('../websocket');

module.exports = function(app, devServer) {
  assets.setMiddleware(devServer.middleware);
  configureWebSockets(app, {
    perMessageDeflate: false,
    maxPayload: require('../security').WS_MAX_PAYLOAD_BYTES,
    maxConnections: require('../security').WS_MAX_CONNECTIONS
  });
  routes(app);
  app.ws('/api/ws', require('../routes/ws'));
  tests(app);
  // webpack-dev-server routes haven't been added yet
  // so wait for next tick to add 404 handler
  process.nextTick(() => app.use(pages.notfound));
};
