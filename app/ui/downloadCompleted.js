const html = require('choo/html');
const assets = require('../../common/assets');

module.exports = function(state) {
  const btnText = state.user.loggedIn ? 'okButton' : 'sendYourFilesLink';
  return html`
    <div
      id="download-complete"
      class="flex flex-col items-center justify-center w-full p-2"
    >
      <h1 class="snd-display text-center my-2">
        ${state.translate('downloadFinish')}
      </h1>
      <svg class="my-8 h-48 text-primary">
        <use xlink:href="${assets.get('completed.svg')}#Page-1" />
      </svg>
      <p
        class="snd-body snd-text-mute leading-normal ${state.user
          .loggedIn
          ? 'hidden'
          : ''}"
      >
        ${state.translate('trySendDescription')}
      </p>
      <p class="my-5">
        <a href="/" class="snd-btn snd-btn--primary flex items-center mt-4" role="button"
          >${state.translate(btnText)}</a
        >
      </p>
    </div>
  `;
};
