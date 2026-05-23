const config = require('./config');
const layout = require('./layout');
const assets = require('../common/assets');
const getTranslator = require('./locale');
const { getFxaConfig } = require('./fxa');
const fs = require('fs');
const path = require('path');

module.exports = async function(req) {
  const locale = (() => {
    if (config.custom_locale != '' && fs.existsSync(path.join(__dirname,'../public/locales',config.custom_locale))) {
        return config.custom_locale;
    }
    else {
      return req.language || 'en-US';
    }
  })();
  let authConfig = null;
  // SND is privacy-focused: no route should be indexed by default,
  // including the marketing home page. Operators wanting their public
  // instance crawlable can override the meta tag at the reverse-proxy
  // layer if needed.
  const robots = 'noindex, nofollow';
  if (config.fxa_client_id) {
    try {
      authConfig = await getFxaConfig();
      authConfig.client_id = config.fxa_client_id;
    } catch (e) {
      // continue without accounts
    }
  }
  const prefs = {};
  if (config.survey_url) {
    prefs.surveyUrl = config.survey_url;
  }
  const baseUrl = config.deriveBaseUrl(req);
  const uiAssets = {
    android_chrome_192px: assets.get('android-chrome-192x192.png'),
    android_chrome_512px: assets.get('android-chrome-512x512.png'),
    apple_touch_icon: assets.get('apple-touch-icon.png'),
    favicon_16px: assets.get('favicon-16x16.png'),
    favicon_32px: assets.get('favicon-32x32.png'),
    icon: assets.get('icon.svg'),
    safari_pinned_tab: assets.get('safari-pinned-tab.svg'),
    facebook: baseUrl + '/' + assets.get('send-fb.jpg'),
    twitter: baseUrl + '/' + assets.get('send-twitter.jpg'),
    wordmark: assets.get('wordmark.svg') + '#logo',
    custom_css: ''
  };
  Object.keys(uiAssets).forEach(index => {
    if (config.ui_custom_assets[index] !== '')
      uiAssets[index] = config.ui_custom_assets[index];
  });
  return {
    archive: {
      numFiles: 0
    },
    locale,
    capabilities: { account: false },
    translate: getTranslator(locale),
    title: config.custom_title,
    description: config.custom_description,
    baseUrl,
    ui: {
      colors: {
        primary: config.ui_color_primary,
        accent: config.ui_color_accent
      },
      assets: uiAssets
    },
    storage: {
      files: []
    },
    fileInfo: {},
    cspNonce: req.cspNonce,
    user: { avatar: assets.get('user.svg'), loggedIn: false },
    robots,
    authConfig,
    prefs,
    layout
  };
};
