const html = require('choo/html');

module.exports = function(state, emit) {
  return html`
    <send-modal class="snd-modal" role="dialog" aria-modal="true">
      <div class="snd-modal-backdrop" onclick=${close}></div>
      <div class="snd-modal-card" onclick=${stop}>
        ${state.modal(state, emit, close)}
      </div>
    </send-modal>
  `;

  function close(event) {
    if (event) { event.preventDefault(); event.stopPropagation(); }
    emit('closeModal');
  }
  function stop(event) { event.stopPropagation(); }
};
