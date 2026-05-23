const html = require('choo/html');

module.exports = function() {
  return html`
    <footer class="snd-statusbar" role="contentinfo" aria-label="security status">
      <span class="snd-tick snd-text-dim">aes-128-gcm · pbkdf2 · zero-knowledge</span>
      <span class="snd-tick snd-text-dim">files encrypted in your browser</span>
    </footer>
  `;
};
