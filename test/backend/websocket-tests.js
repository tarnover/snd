const assert = require('assert');
const { PassThrough } = require('stream');
// ws is the transport dependency exposed through @dannycoates/express-ws.
// eslint-disable-next-line node/no-extraneous-require
const WebSocket = require('ws');
const uploadRoute = require('../../server/routes/ws');

describe('WebSocket upload transport', function() {
  it('handles a malformed frame without an uncaught error', function(done) {
    const ws = new WebSocket(null, undefined, {
      autoPong: true,
      closeTimeout: 30000
    });
    const socket = new PassThrough();
    uploadRoute(ws, {
      headers: { host: 'localhost' },
      secure: false,
      socket: { remoteAddress: '127.0.0.1' }
    });
    ws.once('error', error => {
      assert.equal(error.code, 'WS_ERR_EXPECTED_MASK');
      socket.destroy();
      done();
    });
    ws.setSocket(socket, Buffer.alloc(0), {
      allowSynchronousEvents: true,
      maxPayload: 1024,
      skipUTF8Validation: false
    });
    socket.write(Buffer.from([0x81, 0x01, 0x78]));
  });
});
