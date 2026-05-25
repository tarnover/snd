const html = require('choo/html');
const modal = require('./modal');

module.exports = function(state, emit) {
  const btnText = state.user.loggedIn ? 'okButton' : 'sendYourFilesLink';
  return html`
    <main class="snd-main snd-main--centered">
      ${state.modal && modal(state, emit)}
      <section class="snd-complete">
        <div class="snd-complete-hero" aria-hidden="true">
          <svg viewBox="0 0 100 100" width="96" height="96">
            <rect x="1.5" y="1.5" width="97" height="97" fill="none" stroke="var(--snd-line)" stroke-width="1"/>
            <rect x="18" y="18" width="64" height="64" fill="none" stroke="var(--snd-line)" stroke-width="1"/>
            <rect x="35" y="35" width="30" height="30" fill="none" stroke="var(--snd-mute)" stroke-width="1.5"/>
            <line x1="35" y1="65" x2="65" y2="35" stroke="var(--snd-mute)" stroke-width="2" stroke-linecap="square"/>
          </svg>
        </div>
        <p class="snd-tag snd-text-dim">${state.translate('expiredTag')}</p>
        <h1 class="snd-display">
          ${state.translate('expiredTitle')}
        </h1>
        <p class="snd-caption snd-text-dim">
          ${state.translate('expiredCaption')}
        </p>
        <p class="snd-body snd-text-mute ${state.user.loggedIn ? 'hidden' : ''}">
          ${state.translate('trySendDescription')}
        </p>
        <a href="/" class="snd-btn snd-btn--primary" role="button">
          ${state.translate(btnText)}
        </a>
      </section>
    </main>
  `;
};
