const html = require('choo/html');
const raw = require('choo/html/raw');
const assets = require('../../common/assets');

module.exports = function intro(state) {
  const t = key => state.translate(key);

  const notice = state.WEB_UI.MAIN_NOTICE_HTML
    ? html`
        <p class="snd-notice w-full text-center mt-2">
          ${raw(state.WEB_UI.MAIN_NOTICE_HTML)}
        </p>
      `
    : '';

  const sponsor = state.WEB_UI.SHOW_THUNDERBIRD_SPONSOR
    ? html`
        <a
          class="snd-notice w-full text-center mt-4"
          href="https://www.thunderbird.net/"
        >
          <svg
            width="30"
            height="30"
            class="m-2 mr-3 d-inline-block align-middle"
          >
            <image
              xlink:href="${assets.get('thunderbird-icon.svg')}"
              src="${assets.get('thunderbird-icon.svg')}"
              width="30"
              height="30"
            />
          </svg>
          Sponsored by Thunderbird
        </a>
      `
    : '';

  return html`
    <section class="snd-intro">
      <p class="snd-tag">NEW TRANSFER</p>
      <h1 class="snd-display-xl snd-intro-title">${t('introTitle')}</h1>
      <p class="snd-body snd-intro-body">${t('introDescription')}</p>
      ${notice}
      ${sponsor}
    </section>
  `;
};
