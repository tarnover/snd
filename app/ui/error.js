const html = require('choo/html');
const assets = require('../../common/assets');
const modal = require('./modal');

module.exports = function(state, emit) {
  const btnText = state.user.loggedIn ? 'okButton' : 'sendYourFilesLink';
  return html`
    <main class="snd-main snd-main--centered">
      ${state.modal && modal(state, emit)}
      <section class="snd-recipient">
        <h1 class="snd-display text-center my-2">
          ${state.translate('errorPageHeader')}
        </h1>
        <svg class="text-primary my-12 h-48">
          <use xlink:href="${assets.get('error.svg')}#svg114" />
        </svg>
        <p
          class="snd-body snd-text-mute max-w-md text-center leading-normal ${state
            .user.loggedIn
            ? 'hidden'
            : ''}"
        >
          ${state.translate('trySendDescription')}
        </p>
        <p class="my-5">
          <a href="/" class="snd-btn snd-btn--primary flex items-center" role="button"
            >${state.translate(btnText)}</a
          >
        </p>
      </section>
    </main>
  `;
};
