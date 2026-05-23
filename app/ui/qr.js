const html = require('choo/html');
const raw = require('choo/html/raw');
const qrcode = require('../qrcode');

module.exports = function(url) {
  const gen = qrcode(0, 'L');
  gen.addData(url);
  gen.make();
  const qr = gen.createSvgTag({ scalable: true });
  return html`
    <div class="snd-qr-card">
      ${raw(qr)}
    </div>
  `;
};
