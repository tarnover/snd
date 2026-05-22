const html = require('choo/html');
const Header = require('./header');
const Footer = require('./footer');
const statusBar = require('./statusBar');

module.exports = function body(main) {
  return function(state, emit) {
    const b = html`
      <body class="snd-body-shell flex flex-col">
        ${state.cache(Header, 'header').render()}
        ${main(state, emit)}
        ${state.cache(Footer, 'footer').render()}
        ${statusBar(state)}
      </body>
    `;
    if (state.layout) {
      return state.layout(state, b);
    }
    return b;
  };
};
