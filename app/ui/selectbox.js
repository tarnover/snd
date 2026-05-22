const html = require('choo/html');

module.exports = function(selected, options, translate, changed, htmlId) {
  function choose(event) {
    if (event.target.value != selected) {
      console.log(
        'Selected new value from dropdown',
        htmlId,
        ':',
        selected,
        '->',
        event.target.value
      );
      changed(event.target.value);
    }
  }

  return html`
    <select
      id="${htmlId}"
      class="snd-select"
      data-selected="${selected}"
      onchange="${choose}"
    >
      ${options.map(
        value =>
          html`
            <option value="${value}" ${value == selected ? 'selected' : ''}>
              ${translate(value)}
            </option>
          `
      )}
    </select>
  `;
};
