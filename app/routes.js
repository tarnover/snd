const choo = require('choo');
const download = require('./ui/download');
const body = require('./ui/body');

module.exports = function(app = choo({ hash: true })) {
  app.route('/', body(require('./ui/home')));
  app.route('/dl/:id', body(download));
  app.route('/dl/:id/:key', body(download));
  // Back-compat for legacy share links opened in environments where the
  // server-side redirect did not run (cached SPA navigation, etc.).
  app.route('/download/:id', body(download));
  app.route('/download/:id/:key', body(download));
  app.route('/unsupported/:reason', body(require('./ui/unsupported')));
  app.route('/error', body(require('./ui/error')));
  app.route('/blank', body(require('./ui/blank')));
  app.route('/oauth', function(state, emit) {
    emit('authenticate', state.query.code, state.query.state);
  });
  app.route('/login', function(state, emit) {
    emit('replaceState', '/');
    setTimeout(() => emit('render'));
  });
  app.route('*', body(require('./ui/notFound')));
  return app;
};
