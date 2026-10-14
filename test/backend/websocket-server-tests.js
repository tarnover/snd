const assert = require('assert');
const { EventEmitter } = require('events');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

class FakeWebSocketServer extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
  }
}

describe('WebSocket server admission', function() {
  it('rejects unknown paths and capacity before the handshake', function() {
    this.timeout(10000);
    const server = { listen: sinon.stub() };
    const app = {};
    const configure = proxyquire('../../server/websocket', {
      http: { createServer: () => server },
      ws: { Server: FakeWebSocketServer }
    });
    const wss = configure(app, { maxConnections: 1, maxPayload: 1024 });
    app.ws('/api/ws', sinon.stub());

    const unknown = sinon.stub();
    wss.options.verifyClient({ req: { url: '/other' } }, unknown);
    sinon.assert.calledWith(unknown, false, 404);

    const allowed = sinon.stub();
    wss.options.verifyClient({ req: { url: '/api/ws' } }, allowed);
    sinon.assert.calledWith(allowed, true);

    const socket = new EventEmitter();
    wss.emit('connection', socket, {
      url: '/api/ws',
      headers: {},
      socket: {}
    });
    const full = sinon.stub();
    wss.options.verifyClient({ req: { url: '/api/ws' } }, full);
    sinon.assert.calledWith(full, false, 503);
    socket.emit('close');
    assert.equal(server.listen.called, false);
  });
});
