const html = require('choo/html');

module.exports = function(state, emit) {
  const fileInfo = state.fileInfo;
  const invalid = fileInfo.password === null;
  const t = state.translate;

  const div = html`
    <div class="snd-password-screen">
      <div class="snd-password-hero" aria-hidden="true">
        <div class="snd-password-lock">
          <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--snd-accent)" stroke-width="1.5">
            <rect x="4" y="11" width="16" height="10"/>
            <path d="M8 11 V7 a4 4 0 0 1 8 0 V11"/>
          </svg>
        </div>
      </div>
      <p class="snd-tag">PASSWORD-PROTECTED</p>
      <h1 class="snd-display">${t('downloadTitle')}</h1>
      <p class="snd-body-sm">${t('downloadDescription')}</p>

      <form class="snd-password-form ${invalid ? 'is-invalid' : ''}"
            onsubmit="${checkPassword}" data-no-csrf>
        <input id="password-input"
               class="snd-input snd-input--mask"
               maxlength="4096"
               autocomplete="off"
               placeholder="${t('unlockInputPlaceholder')}"
               oninput="${inputChanged}"
               type="password"/>
        <input type="submit"
               id="password-btn"
               class="snd-btn snd-btn--primary"
               value="${t('unlockButtonLabel')}"
               title="${t('unlockButtonLabel')}"/>
      </form>

      <label id="password-error"
             class="snd-caption snd-text-danger ${invalid ? '' : 'is-hidden'}"
             for="password-input">
        ${t('passwordTryAgain')}
      </label>
    </div>
  `;

  if (!(div instanceof String)) {
    setTimeout(() => document.getElementById('password-input').focus());
  }

  function inputChanged(event) {
    event.stopPropagation();
    event.preventDefault();
    document.getElementById('password-error').classList.add('is-hidden');
    document.querySelector('.snd-password-form').classList.remove('is-invalid');
  }

  function checkPassword(event) {
    event.stopPropagation();
    event.preventDefault();
    const el = document.getElementById('password-input');
    const password = el.value;
    if (password.length > 0) {
      document.getElementById('password-btn').disabled = true;
      const fileInfoUrl = window.location.href.replace(/\?.+#/, '#');
      state.fileInfo.url = fileInfoUrl;
      state.fileInfo.password = password;
      emit('getMetadata');
    }
    return false;
  }

  return div;
};
