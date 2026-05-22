const html = require('choo/html');
const assets = require('../../common/assets');
const { bytes } = require('../utils');

module.exports = function() {
  return function(state, emit, close) {
    const DAYS = Math.floor(state.LIMITS.MAX_EXPIRE_SECONDS / 86400);
    let submitting = false;
    return html`
      <send-signup-dialog
        class="flex flex-col justify-center w-full"
        style="padding:32px 0"
      >
        <img src="${assets.get('master-logo.svg')}" class="h-16" style="margin-bottom:16px" />
        <section class="flex flex-col flex-shrink-0 self-center" style="margin-bottom:16px">
          <h1 class="snd-display" style="text-align:center;margin-bottom:16px">
            ${state.translate('accountBenefitTitle')}
          </h1>
          <ul
            class="snd-body snd-text-mute"
            style="list-style:disc;padding-left:20px;margin:0"
          >
            <li>
              ${state.translate('accountBenefitLargeFiles', {
                size: bytes(state.LIMITS.MAX_FILE_SIZE)
              })}
            </li>
            <li>${state.translate('accountBenefitDownloadCount')}</li>
            <li>
              ${state.translate('accountBenefitTimeLimit', { count: DAYS })}
            </li>
            <li>${state.translate('accountBenefitSync')}</li>
          </ul>
        </section>
        <section class="flex flex-col flex-grow" style="align-self:center;width:100%;max-width:480px">
          <form onsubmit=${submitEmail} data-no-csrf>
            <input
              id="email-input"
              type="email"
              class="snd-input hidden"
              style="margin-bottom:12px"
              placeholder=${state.translate('emailPlaceholder')}
            />
            <input
              class="snd-btn snd-btn--primary snd-btn--full"
              value="${state.translate('signInOnlyButton')}"
              title="${state.translate('signInOnlyButton')}"
              id="email-submit"
              type="submit"
            />
          </form>
          ${state.user.loginRequired
            ? ''
            : html`
                <button
                  class="snd-btn snd-btn--ghost snd-text-mute"
                  style="margin-top:12px"
                  title="${state.translate('deletePopupCancel')}"
                  onclick=${cancel}
                >
                  ${state.translate('deletePopupCancel')}
                </button>
              `}
        </section>
      </send-signup-dialog>
    `;

    function emailish(str) {
      if (!str) {
        return false;
      }
      // just check if it's the right shape
      const a = str.split('@');
      return a.length === 2 && a.every(s => s.length > 0);
    }

    function cancel(event) {
      close(event);
    }

    function submitEmail(event) {
      event.preventDefault();
      if (submitting) {
        return;
      }
      submitting = true;

      const el = document.getElementById('email-input');
      const email = el.value;
      emit('login', emailish(email) ? email : null);
    }
  };
};
