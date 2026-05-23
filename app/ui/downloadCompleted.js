const html = require('choo/html');

module.exports = function(state) {
  const btnText = state.user.loggedIn ? 'okButton' : 'sendYourFilesLink';
  return html`
    <div
      id="download-complete"
      class="snd-complete flex flex-col items-center justify-center w-full"
    >
      <div class="snd-complete-hero" aria-hidden="true">
        <svg viewBox="0 0 100 100" width="96" height="96">
          <rect x="1.5" y="1.5" width="97" height="97" fill="none" stroke="var(--snd-line)" stroke-width="1"/>
          <rect x="18" y="18" width="64" height="64" fill="none" stroke="var(--snd-line)" stroke-width="1"/>
          <rect x="35" y="35" width="30" height="30" fill="none" stroke="var(--snd-accent)" stroke-width="1.5"/>
          <path d="M 41 50 L 47 56 L 60 43" fill="none" stroke="var(--snd-accent)" stroke-width="2" stroke-linecap="square" stroke-linejoin="miter"/>
        </svg>
      </div>
      <p class="snd-tag snd-text-accent">DECRYPTED</p>
      <h1 class="snd-display text-center">
        ${state.translate('downloadFinish')}
      </h1>
      <p class="snd-caption snd-text-dim">
        > decrypted in your browser · removed from sender
      </p>
      <p class="snd-body snd-text-mute text-center ${state.user.loggedIn ? 'hidden' : ''}">
        ${state.translate('trySendDescription')}
      </p>
      <p>
        <a href="/" class="snd-btn snd-btn--primary" role="button">
          ${state.translate(btnText)}
        </a>
      </p>
    </div>
  `;
};
