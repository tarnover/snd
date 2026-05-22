const html = require('choo/html');
const Component = require('choo/component');
const Account = require('./account');
const assets = require('../../common/assets');
const { platform } = require('../utils');

class Header extends Component {
  constructor(name, state, emit) {
    super(name);
    this.state = state;
    this.emit = emit;
    this.account = state.cache(Account, 'account');
  }

  update() {
    this.account.render();
    return false;
  }

  createElement() {
    const t = this.state.translate;
    const version = this.state.WEB_UI ? this.state.WEB_UI.VERSION || '' : '';
    const route = (typeof window !== 'undefined') ? window.location.pathname : '/';
    const isActive = path => (path === '/' ? route === '/' : route.startsWith(path));
    return html`
      <header class="snd-nav flex flex-row items-center justify-between w-full" role="banner">
        <a class="snd-brand flex flex-row items-center" href="/" aria-label="SND home">
          <span class="snd-brand-mark" aria-hidden="true">
            <svg viewBox="0 0 22 22" width="22" height="22">
              <rect x="0.75" y="0.75" width="20.5" height="20.5" fill="none" stroke="var(--snd-accent)" stroke-width="1.5"/>
              <text x="11" y="15.6" text-anchor="middle" font-family="var(--snd-font-mono)" font-size="13" font-weight="500" fill="var(--snd-text)">S</text>
            </svg>
          </span>
          <span class="snd-brand-word snd-code">SND</span>
        </a>
        <nav class="snd-nav-items flex flex-row" role="navigation">
          <a class="snd-nav-item ${isActive('/') ? 'is-active' : ''}" href="/">${t('uploadPageHeader')}</a>
        </nav>
        <div class="snd-nav-status snd-code-sm">
          <span class="snd-status-dot" aria-hidden="true"></span>
          <span>e2e ● active</span>
          <span class="snd-text-dim"> · v${version || ''}</span>
          ${this.account.render()}
        </div>
      </header>
    `;
  }
}

module.exports = Header;
