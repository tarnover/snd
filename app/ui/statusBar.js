const html = require('choo/html');

module.exports = function(state) {
  const t = state.translate;
  // Two informational lines, no behaviour. Strings come from existing l10n if
  // present; otherwise fall back to English defaults that match the Vault spec.
  const left = (t && t('statusBarTechnical')) || 'aes-128-gcm · pbkdf2 · zero-knowledge';
  const right = (t && t('statusBarReassurance')) || 'files encrypted in your browser';
  return html`
    <footer class="snd-statusbar" role="contentinfo" aria-label="security status">
      <span class="snd-tick snd-text-dim">${left}</span>
      <span class="snd-tick snd-text-dim">${right}</span>
    </footer>
  `;
};
