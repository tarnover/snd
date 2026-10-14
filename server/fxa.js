const fetch = require('node-fetch');
const config = require('./config');
const security = require('./security');

const KEY_SCOPE = config.fxa_key_scope;
let fxaConfig = null;
let configPromise = null;
let lastConfigRefresh = 0;
let activeVerifications = 0;

async function refreshFxaConfig() {
  const res = await fetch(`${config.fxa_url}/.well-known/openid-configuration`, {
    timeout: security.FXA_TIMEOUT_MS,
    size: security.FXA_MAX_RESPONSE_BYTES
  });
  if (!res.ok) {
    throw new Error(`FxA discovery failed: ${res.status}`);
  }
  const discovered = await res.json();
  if (!discovered || typeof discovered.jwks_uri !== 'string') {
    throw new Error('FxA discovery response is invalid');
  }
  discovered.key_scope = KEY_SCOPE;
  fxaConfig = discovered;
  lastConfigRefresh = Date.now();
  return fxaConfig;
}

async function getFxaConfig() {
  if (!config.fxa_client_id) {
    return null;
  }
  if (fxaConfig && Date.now() - lastConfigRefresh < 1000 * 60 * 5) {
    return fxaConfig;
  }
  if (!configPromise) {
    configPromise = refreshFxaConfig()
      .catch(() => fxaConfig)
      .finally(() => {
        configPromise = null;
      });
  }
  return configPromise;
}

module.exports = {
  getFxaConfig,
  verify: async function(token) {
    if (
      !config.fxa_client_id ||
      !token ||
      activeVerifications >= security.FXA_MAX_CONCURRENCY
    ) {
      return null;
    }

    activeVerifications++;
    try {
      const c = await getFxaConfig();
      if (!c) {
        return null;
      }
      const verifyUrl = c.jwks_uri.replace('jwks', 'verify'); //HACK
      const result = await fetch(verifyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
        timeout: security.FXA_TIMEOUT_MS,
        size: security.FXA_MAX_RESPONSE_BYTES
      });
      if (!result.ok) {
        return null;
      }
      const info = await result.json();
      if (
        info.scope &&
        Array.isArray(info.scope) &&
        info.scope.includes(KEY_SCOPE)
      ) {
        return info.user;
      }
    } catch (e) {
      return null;
    } finally {
      activeVerifications--;
    }
    return null;
  }
};
