const html = require('choo/html');

module.exports = function(name, url) {
  const dialog = function(state, emit, close) {
    return html`
      <send-share-dialog
        class="flex flex-col items-center text-center"
      >
        <h1 class="snd-display" style="margin-bottom:16px">
          ${state.translate('notifyUploadEncryptDone')}
        </h1>
        <p class="snd-body snd-text-mute" style="margin-bottom:16px">
          ${state.translate('shareLinkDescription')}<br />
          ${name}
        </p>
        <input
          type="text"
          id="share-url"
          class="snd-input snd-code"
          style="margin-bottom:16px"
          value="${url}"
          readonly="true"
        />
        <button
          class="snd-btn snd-btn--primary snd-btn--full"
          onclick="${share}"
          title="${state.translate('shareLinkButton')}"
        >
          ${state.translate('shareLinkButton')}
        </button>
        <button
          class="snd-btn snd-btn--ghost snd-text-mute"
          style="margin-top:12px"
          onclick="${close}"
          title="${state.translate('okButton')}"
        >
          ${state.translate('okButton')}
        </button>
      </send-share-dialog>
    `;

    async function share(event) {
      event.stopPropagation();
      try {
        await navigator.share({
          title: state.translate('-send-brand'),
          text: state.translate('shareMessage', { name }),
          url
        });
      } catch (e) {
        if (e.code === e.ABORT_ERR) {
          return;
        }
        console.error(e);
      }
      close();
    }
  };
  dialog.type = 'share';
  return dialog;
};
