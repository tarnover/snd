const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const VersionPlugin = require('./build/version_plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const webJsOptions = {
  babelrc: false,
  presets: [
    [
      '@babel/preset-env',
      {
        bugfixes: true,
        useBuiltIns: 'entry',
        corejs: 3
      }
    ]
  ],
  plugins: [
    '@babel/plugin-syntax-dynamic-import',
    'module:nanohtml',
    ['@babel/plugin-proposal-class-properties', { loose: false }]
  ]
};

const serviceWorker = {
  target: 'webworker',
  entry: {
    serviceWorker: './app/serviceWorker.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/'
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[contenthash:8].[ext]',
          esModule: false
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash:8].[ext]',
              esModule: false
            }
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      removeViewBox: false // true causes stretched images
                    }
                  }
                },
                'convertStyleToAttrs', // for CSP, no unsafe-eval
                'removeTitle' // for smallness
              ]
            }
          }
        ]
      },
      {
        // loads all assets from assets/ for use by common/assets.js
        test: require.resolve('./common/generate_asset_map.js'),
        use: ['babel-loader', 'val-loader']
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /\.\.\/dist/ }),
    new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] })
  ],
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      path: require.resolve('path-browserify')
    }
  }
};

const web = {
  target: 'web',
  entry: {
    app: ['./app/main.js']
  },
  output: {
    chunkFilename: '[name].[contenthash:8].js',
    filename: '[name].[contenthash:8].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: ''
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        oneOf: [
          {
            loader: 'babel-loader',
            include: [
              path.resolve(__dirname, 'app'),
              path.resolve(__dirname, 'common'),
              // some dependencies need to get re-babeled because we
              // have different targets than their default configs
              path.resolve(
                __dirname,
                'node_modules/@dannycoates/webcrypto-liner'
              ),
              path.resolve(__dirname, 'node_modules/@fluent'),
              path.resolve(__dirname, 'node_modules/intl-pluralrules')
            ],
            options: webJsOptions
          },
          {
            // Strip asserts from our deps, mainly choojs family
            include: [path.resolve(__dirname, 'node_modules')],
            exclude: [
              path.resolve(__dirname, 'node_modules/crc'),
              path.resolve(__dirname, 'node_modules/@fluent'),
              path.resolve(__dirname, 'node_modules/tslib'),
              path.resolve(__dirname, 'node_modules/webcrypto-core')
            ],
            loader: 'webpack-unassert-loader'
          }
        ]
      },
      {
        test: /\.woff2?$/,
        loader: 'file-loader',
        options: { name: '[name].[contenthash:8].[ext]' }
      },
      {
        test: /\.(png|jpg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[contenthash:8].[ext]',
          esModule: false
        }
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              name: '[name].[contenthash:8].[ext]',
              esModule: false
            }
          },
          {
            loader: 'svgo-loader',
            options: {
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: {
                      cleanupIds: false, // ids referenced by CSS/JS
                      removeViewBox: false // true causes stretched images
                    }
                  }
                },
                'convertStyleToAttrs', // for CSP, no unsafe-eval
                'removeTitle' // for smallness
              ]
            }
          }
        ]
      },
      {
        // creates style.css with all styles
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              esModule: false
            }
          },
          'postcss-loader'
        ]
      },
      {
        test: /\.ftl$/,
        use: 'raw-loader'
      },
      {
        // creates test.js for /test
        test: require.resolve('./test/frontend/index.js'),
        use: ['babel-loader', 'val-loader']
      },
      {
        // loads all assets from assets/ for use by common/assets.js
        test: require.resolve('./common/generate_asset_map.js'),
        use: ['babel-loader', 'val-loader']
      }
    ]
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          context: 'public',
          from: '*.*'
        }
      ]
    }),
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new webpack.IgnorePlugin({ resourceRegExp: /\.\.\/dist/ }), // used in common/*.js
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      // assert polyfill (test bundle) needs process; require.resolve so
      // .mjs deps (asmcrypto) get a fully-specified path
      process: require.resolve('process/browser')
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css'
    }),
    new VersionPlugin(), // used for the /__version__ route
    new WebpackManifestPlugin() // used by server side to resolve hashed assets
  ],
  resolve: {
    fallback: {
      buffer: require.resolve('buffer/'),
      path: require.resolve('path-browserify'),
      // only the frontend test bundle (dev mode) imports assert; lazy,
      // so it stays out of the production app bundle
      assert: require.resolve('assert/')
    }
  },
  devtool: 'source-map',
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (process.env.NODE_ENV === 'development') {
        require('./server/bin/dev')(devServer.app, devServer);
      }
      return middlewares;
    },
    compress: true,
    hot: false,
    host: '0.0.0.0',
    proxy: [
      {
        context: ['/api/ws'],
        target: 'ws://localhost:8081',
        ws: true,
        secure: false
      }
    ]
  }
};

module.exports = (env, argv) => {
  const mode = argv.mode || 'production';
  // eslint-disable-next-line no-console
  console.error(`mode: ${mode}`);
  process.env.NODE_ENV = web.mode = serviceWorker.mode = mode;
  if (mode === 'development') {
    // istanbul instruments the source for code coverage
    webJsOptions.plugins.push('istanbul');
    web.entry.tests = ['./test/frontend/index.js'];
  }
  return [web, serviceWorker];
};
