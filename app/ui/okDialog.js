const html = require('choo/html');

module.exports = function(message) {
  return function(state, emit, close) {
    return html`
      <send-ok-dialog class="flex flex-col">
        <h2 class="snd-display" style="text-align:center;margin-bottom:24px">
          ${message}
        </h2>
        <button
          class="snd-btn snd-btn--primary snd-btn--full"
          onclick="${close}"
          title="${state.translate('okButton')}"
        >
          ${state.translate('okButton')}
        </button>
      </send-ok-dialog>
    `;
  };
};
