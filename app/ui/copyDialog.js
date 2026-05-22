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
        <div class="flex flex-row items-center justify-center w-full" style="margin-bottom:16px">
          <input
            type="text"
            id="share-url"
            class="snd-input snd-code"
            style="flex:1"
            value="${url}"
            readonly="true"
          />
          <button
            id="qr-btn"
            class="snd-btn snd-btn--ghost"
            style="width:40px;height:40px;padding:4px;flex-shrink:0;margin-left:8px"
            onclick="${toggleQR}"
            title="QR code"
          >
            ${qr(url)}
          </button>
        </div>
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

    function toggleQR(event) {
      event.stopPropagation();
      const shareUrl = document.getElementById('share-url');
      const qrBtn = document.getElementById('qr-btn');
      if (shareUrl.classList.contains('hidden')) {
        shareUrl.classList.remove('hidden');
        qrBtn.style.width = '40px';
        qrBtn.style.height = '40px';
      } else {
        shareUrl.classList.add('hidden');
        qrBtn.style.width = '192px';
        qrBtn.style.height = '192px';
      }
    }

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
