const webpack = require('webpack');
const gitRevSync = require('git-rev-sync');
const pkg = require('../package.json');

let commit = 'unknown';

try {
  commit = gitRevSync.short();
} catch (e) {
  console.warn('Error fetching current git commit: ' + e);
}

const version = JSON.stringify({
  commit,
  source: pkg.homepage,
  version: process.env.CIRCLE_TAG || `v${pkg.version}`
});

class VersionPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('VersionPlugin', compilation => {
      compilation.hooks.processAssets.tap(
        {
          name: 'VersionPlugin',
          stage: webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL
        },
        () => {
          compilation.emitAsset(
            'version.json',
            new webpack.sources.RawSource(version)
          );
        }
      );
    });
  }
}

module.exports = VersionPlugin;
