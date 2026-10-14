const conf = require('./config');
const util = require('util');

// intel still calls the deprecated util.isError(), which was removed in newer
// Node releases even though this project supports all Node versions >= 20.
if (typeof util.isError !== 'function') {
  util.isError = util.types.isNativeError;
}

const isProduction = conf.env === 'production';

const mozlog = require('mozlog')({
  app: 'FirefoxSend',
  level: isProduction ? 'INFO' : 'verbose',
  fmt: isProduction ? 'heka' : 'pretty',
  debug: !isProduction
});

module.exports = mozlog;
