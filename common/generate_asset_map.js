/*
  This code is included by both the server and frontend via
  common/assets.js

  When included from the server the export will be the function.

  When included from the frontend (via webpack) the export will
  be an object mapping file names to hashed file names. Example:
  "send_logo.svg": "send_logo.5fcfdf0e.svg"
*/

const fs = require('fs');
const path = require('path');

function kv(f) {
  return `"${f}": require('../assets/${f}')`;
}

module.exports = function() {
  const assetsDir = path.join(__dirname, '..', 'assets');
  const files = fs
    .readdirSync(assetsDir)
    .filter(f => fs.statSync(path.join(assetsDir, f)).isFile());
  const code = `module.exports = {
    ${files.map(kv).join(',\n')}
  };`;
  return {
    code,
    dependencies: files.map(f => require.resolve('../assets/' + f)),
    cacheable: true
  };
};
