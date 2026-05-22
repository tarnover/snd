const html = require('choo/html');
const modal = require('./modal');

module.exports = function(state, emit) {
  let strings = {};
  let why = '';
  let url = '';

  if (state.params.reason !== 'outdated') {
    strings = unsupportedStrings(state);
    why = html`
      <a
        class="snd-text-accent"
        href="https://github.com/timvisee/send/blob/master/docs/faq.md#why-is-my-browser-not-supported"
      >
        ${state.translate('notSupportedLink')}
      </a>
    `;
    url =
      'https://www.mozilla.org/firefox/new/?utm_campaign=send-acquisition&utm_medium=referral&utm_source=send.firefox.com';
  } else {
    strings = outdatedStrings(state);
    url = 'https://support.mozilla.org/kb/update-firefox-latest-version';
  }

  return html`
    <main class="snd-main snd-main--centered">
      ${state.modal && modal(state, emit)}
      <section class="snd-recipient flex flex-col items-center text-center">
        <h1 class="snd-display">${strings.header}</h1>
        <p class="snd-body snd-text-mute mt-4 mb-8 max-w-md leading-normal">${strings.description}</p>
        ${why}
        <a href="${url}" class="snd-btn snd-btn--primary mt-8 px-8">
          ${strings.button}
        </a>
      </section>
    </main>
  `;
};

function outdatedStrings(state) {
  return {
    header: state.translate('notSupportedHeader'),
    description: state.translate('notSupportedOutdatedDetail'),
    button: state.translate('updateFirefox')
  };
}

function unsupportedStrings(state) {
  return {
    header: state.translate('notSupportedHeader'),
    description: state.translate('notSupportedDescription'),
    button: state.translate('downloadFirefox')
  };
}
