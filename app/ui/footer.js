const html = require('choo/html');
const Component = require('choo/component');

class Footer extends Component {
  constructor(name, state, emit) {
    super(name);
    this.state = state;
    this.emit = emit;
  }

  update() {
    return false;
  }

  createElement() {
    const translate = this.state.translate;
    const emit = this.emit;

    const onHowItWorks = e => {
      e.preventDefault();
      emit('showHowItWorks');
    };

    // Add additional links from configuration if available
    var links = [
      html`
        <li class="snd-footer-item">
          <a href="#" onclick=${onHowItWorks}>
            ${translate('footerLinkHowItWorks')}
          </a>
        </li>
      `
    ];
    if (this.state != undefined && this.state.WEB_UI != undefined) {
      const WEB_UI = this.state.WEB_UI;

      if (WEB_UI.FOOTER_DONATE_URL != '') {
        links.push(html`
          <li class="snd-footer-item">
            <a href="${WEB_UI.FOOTER_DONATE_URL}" target="_blank">
              ${translate('footerLinkDonate')}
            </a>
          </li>
        `);
      }
      if (WEB_UI.FOOTER_CLI_URL != '') {
        links.push(html`
          <li class="snd-footer-item">
            <a href="${WEB_UI.FOOTER_CLI_URL}" target="_blank">
              ${translate('footerLinkCli')}
            </a>
          </li>
        `);
      }
      if (WEB_UI.FOOTER_DMCA_URL != '') {
        links.push(html`
          <li class="snd-footer-item">
            <a href="${WEB_UI.FOOTER_DMCA_URL}" target="_blank">
              ${translate('footerLinkDmca')}
            </a>
          </li>
        `);
      }
      if (WEB_UI.FOOTER_SOURCE_URL != '') {
        links.push(html`
          <li class="snd-footer-item">
            <a href="${WEB_UI.FOOTER_SOURCE_URL}" target="_blank">
              ${translate('footerLinkSource')}
            </a>
          </li>
        `);
      }
    } else {
      links.push(html`
        <li class="snd-footer-item">
          <a href="https://github.com/tarnover/snd" target="_blank">
            ${translate('footerLinkSource')}
          </a>
        </li>
      `);
    }

    // Defining a custom footer
    var footer = [];
    if (this.state != undefined && this.state.WEB_UI != undefined) {
      const WEB_UI = this.state.WEB_UI;

      if (WEB_UI.CUSTOM_FOOTER_URL != '' && WEB_UI.CUSTOM_FOOTER_TEXT != '') {
        footer.push(html`
          <li class="snd-footer-item">
            <a href="${WEB_UI.CUSTOM_FOOTER_URL}" target="_blank">
              ${WEB_UI.CUSTOM_FOOTER_TEXT}
            </a>
          </li>
        `);
      }
      else if (WEB_UI.CUSTOM_FOOTER_URL != '') {
        footer.push(html`
          <li class="snd-footer-item">
            <a href="${WEB_UI.CUSTOM_FOOTER_URL}" target="_blank">
              ${WEB_UI.CUSTOM_FOOTER_URL}
            </a>
          </li>
        `);
      }
      else if (WEB_UI.CUSTOM_FOOTER_TEXT != '') {
        footer.push(html`
          <li class="snd-footer-item">
            ${WEB_UI.CUSTOM_FOOTER_TEXT}
          </li>
        `)
      }
      else  {
        footer.push(html`
          <li class="snd-footer-item">
            Sponsored by
            <a href="https://thirdkey.ai" target="_blank" rel="noopener noreferrer">thirdkey.ai</a>
          </li>
        `);
      }
    }

    return html`
      <footer class="snd-footer">
        <ul class="snd-footer-list">
          ${footer}
        </ul>
        <ul class="snd-footer-list">
          ${links}
        </ul>
      </footer>
    `;
  }
}

module.exports = Footer;
