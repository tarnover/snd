const html = require('choo/html');
const version = require('../../package.json').version;
const { browserName } = require('../utils');

module.exports = function() {
  return function(state, emit, close) {
    const surveyUrl = `${
      state.PREFS.surveyUrl
    }?ver=${version}&browser=${browserName()}&anon=${
      state.user.loggedIn
    }&active_count=${state.storage.files.length}`;
    return html`
      <send-survey-dialog
        class="flex flex-col items-center text-center"
      >
        <h1 class="snd-display" style="margin-bottom:16px">
          Tell us what you think.
        </h1>
        <p class="snd-body snd-text-mute" style="margin-bottom:16px">
          Love Send? Take a quick survey to let us know how we can make it
          better.
        </p>
        <a
          class="snd-btn snd-btn--primary snd-btn--full"
          style="margin-bottom:12px"
          onclick="${() => emit('closeModal')}"
          title="Give feedback"
          href="${surveyUrl}"
          target="_blank"
        >
          Give feedback
        </a>
        <button
          class="snd-btn snd-btn--ghost snd-text-mute"
          onclick="${close}"
          title="Skip"
        >
          Skip
        </button>
      </send-survey-dialog>
    `;
  };
};
