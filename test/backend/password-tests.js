const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const storage = {
  setFields: sinon.stub()
};

function request(id, body) {
  return {
    params: { id },
    body
  };
}

function response() {
  return {
    sendStatus: sinon.stub()
  };
}

const passwordRoute = proxyquire('../../server/routes/password', {
  '../storage': storage
});

describe('/api/password', function() {
  afterEach(function() {
    storage.setFields.reset();
  });

  it('sets password fields in one awaited operation', async function() {
    const req = request('x', { auth: 'z' });
    const res = response();
    await passwordRoute(req, res);
    sinon.assert.calledWith(storage.setFields, 'x', {
      auth: 'z',
      pwd: true
    });
    sinon.assert.calledWith(res.sendStatus, 200);
  });

  it('sends a 400 if auth is missing', async function() {
    const req = request('x', {});
    const res = response();
    await passwordRoute(req, res);
    sinon.assert.calledWith(res.sendStatus, 400);
  });

  it('sends a 404 on failure', async function() {
    storage.setFields.rejects(new Error());
    const req = request('x', { auth: 'z' });
    const res = response();
    await passwordRoute(req, res);
    sinon.assert.calledWith(res.sendStatus, 404);
  });
});
