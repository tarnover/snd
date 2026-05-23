const html = require('choo/html');
const { copyToClipboard } = require('../utils');
const qr = require('./qr');

module.exports = function(name, url) {
  const dialog = function(state, emit, close) {
    return html`
      <send-copy-dialog
        class="flex flex-col items-center text-center"
      >
        <h1 class="snd-display" style="margin-bottom:16px">
          ${state.translate('notifyUploadEncryptDone')}
        </h1>
        <p class="snd-body snd-text-mute" style="margin-bottom:16px">
          ${state.translate('copyLinkDescription')} <br />
          ${name}
        </p>
        <input
          type="text"
          id="share-url"
          class="snd-input snd-code"
          style="width:100%;margin-bottom:16px"
          value="${url}"
          readonly="true"
        />
        <div class="snd-qr-slot">${qr(url)}</div>
        <button
          class="snd-btn snd-btn--primary snd-btn--full"
          onclick="${copy}"
          title="${state.translate('copyLinkButton')}"
        >
          ${state.translate('copyLinkButton')}
        </button>
        <button
          class="snd-btn snd-btn--ghost snd-text-mute"
          style="margin-top:12px"
          onclick="${close}"
          title="${state.translate('okButton')}"
        >
          ${state.translate('okButton')}
        </button>
      </send-copy-dialog>
    `;

    function copy(event) {
      event.stopPropagation();
      copyToClipboard(url);
      event.target.textContent = state.translate('copiedUrl');
      setTimeout(close, 1000);
    }
  };
  dialog.type = 'copy';
  return dialog;
};
