const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

const security = {
  FXA_TIMEOUT_MS: 25,
  FXA_MAX_CONCURRENCY: 1,
  FXA_MAX_RESPONSE_BYTES: 1024
};

function response(body) {
  return {
    ok: true,
    json: sinon.stub().resolves(body)
  };
}

describe('FxA verification', function() {
  it('does no network work when account integration is disabled', async function() {
    const fetch = sinon.stub();
    const fxa = proxyquire('../../server/fxa', {
      'node-fetch': fetch,
      './config': {
        fxa_client_id: '',
        fxa_key_scope: 'scope',
        fxa_url: 'https://accounts.example'
      },
      './security': security
    });
    assert.equal(await fxa.verify('token'), null);
    sinon.assert.notCalled(fetch);
  });

  it('shares discovery work and bounds remote responses', async function() {
    const fetch = sinon.stub();
    fetch.onFirstCall().resolves(
      response({ jwks_uri: 'https://accounts.example/jwks' })
    );
    const fxa = proxyquire('../../server/fxa', {
      'node-fetch': fetch,
      './config': {
        fxa_client_id: 'client',
        fxa_key_scope: 'scope',
        fxa_url: 'https://accounts.example'
      },
      './security': security
    });
    await Promise.all([fxa.getFxaConfig(), fxa.getFxaConfig()]);
    sinon.assert.calledOnce(fetch);
    sinon.assert.calledWithMatch(fetch, sinon.match.string, {
      timeout: security.FXA_TIMEOUT_MS,
      size: security.FXA_MAX_RESPONSE_BYTES
    });
  });

  it('fails fast when verification concurrency is exhausted', async function() {
    let resolveFetch;
    const fetch = sinon.stub().returns(
      new Promise(resolve => {
        resolveFetch = resolve;
      })
    );
    const fxa = proxyquire('../../server/fxa', {
      'node-fetch': fetch,
      './config': {
        fxa_client_id: 'client',
        fxa_key_scope: 'scope',
        fxa_url: 'https://accounts.example'
      },
      './security': security
    });
    const first = fxa.verify('one');
    assert.equal(await fxa.verify('two'), null);
    resolveFetch(response({ jwks_uri: 'https://accounts.example/jwks' }));
    fetch.onSecondCall().resolves(response({ scope: [], user: null }));
    await first;
    sinon.assert.calledTwice(fetch);
  });
});
