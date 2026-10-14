const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const storage = {
  setField: sinon.stub()
};

function request(id) {
  return {
    params: { id },
    body: {}
  };
}

function response() {
  return {
    sendStatus: sinon.stub()
  };
}

const paramsRoute = proxyquire('../../server/routes/params', {
  '../storage': storage
});

describe('/api/params', function() {
  afterEach(function() {
    storage.setField.reset();
  });

  it('calls storage.setField with the correct parameter', async function() {
    const req = request('x');
    const dlimit = 2;
    req.body.dlimit = dlimit;
    const res = response();
    await paramsRoute(req, res);
    sinon.assert.calledWith(storage.setField, 'x', 'dlimit', dlimit);
    sinon.assert.calledWith(res.sendStatus, 200);
  });

  it('sends a 400 if dlimit is too large', async function() {
    const req = request('x');
    const res = response();
    req.body.dlimit = 201;
    await paramsRoute(req, res);
    sinon.assert.calledWith(res.sendStatus, 400);
  });

  it('sends a 404 on failure', async function() {
    storage.setField.rejects(new Error());
    const req = request('x');
    const res = response();
    req.body.dlimit = 2;
    await paramsRoute(req, res);
    sinon.assert.calledWith(res.sendStatus, 404);
  });
});
