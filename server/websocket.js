const http = require('http');
// ws is installed by the legacy express-ws package and pinned by overrides.
// eslint-disable-next-line node/no-extraneous-require
const WebSocket = require('ws');

module.exports = function configureWebSockets(app, options) {
  const server = http.createServer(app);
  const routes = new Map();
  const { maxConnections, ...webSocketOptions } = options;
  let activeConnections = 0;

  function pathname(request) {
    return new URL(request.url, 'http://localhost').pathname;
  }

  const webSocketServer = new WebSocket.Server({
    server,
    ...webSocketOptions,
    verifyClient(info, done) {
      let path;
      try {
        path = pathname(info.req);
      } catch (e) {
        return done(false, 400, 'invalid path');
      }
      if (!routes.has(path)) {
        return done(false, 404, 'unknown path');
      }
      if (activeConnections >= maxConnections) {
        return done(false, 503, 'upload capacity reached');
      }
      done(true);
    }
  });

  app.listen = function listen(...args) {
    return server.listen(...args);
  };
  app.ws = function ws(path, handler) {
    routes.set(path, handler);
    return app;
  };

  webSocketServer.on('connection', (socket, request) => {
    activeConnections++;
    socket.once('close', () => {
      activeConnections--;
    });
    const forwardedProtocol = request.headers['x-forwarded-proto'];
    request.secure =
      !!request.socket.encrypted ||
      (typeof forwardedProtocol === 'string' &&
        forwardedProtocol.split(',')[0].trim() === 'https');
    let routePath;
    try {
      routePath = new URL(request.url, 'http://localhost').pathname;
    } catch (e) {
      return socket.close(1008, 'invalid path');
    }
    const handler = routes.get(routePath);
    if (!handler) {
      return socket.close(1008, 'unknown path');
    }
    handler(socket, request);
  });

  return webSocketServer;
};
