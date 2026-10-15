const html = require('choo/html');
const raw = require('choo/html/raw');
const clientConstants = require('./clientConstants');

module.exports = function(state) {
  const authConfig = state.authConfig
    ? `var AUTH_CONFIG = ${JSON.stringify(state.authConfig)};`
    : '';

  const jsconfig = `
  var LIMITS = ${JSON.stringify(clientConstants.LIMITS)};
  var WEB_UI = ${JSON.stringify(clientConstants.WEB_UI)};
  var DEFAULTS = ${JSON.stringify(clientConstants.DEFAULTS)};
  var downloadMetadata = ${
    state.downloadMetadata ? raw(JSON.stringify(state.downloadMetadata)) : '{}'
  };
  ${authConfig};
  `;
  return state.cspNonce
    ? html`
        <script nonce="${state.cspNonce}">
          ${raw(jsconfig)};
        </script>
      `
    : '';
};
