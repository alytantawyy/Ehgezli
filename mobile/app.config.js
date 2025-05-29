// app.config.js
const appJson = require('./app.json');

module.exports = {
  // spread in everything under "expo" from your static app.json
  expo: {
    ...appJson.expo,

    // now override just the things you care about
    icon: './assets/icon.png',

    splash: {
      ...appJson.expo.splash,
      image: './assets/splash-icon.png',
    },

    android: {
      ...appJson.expo.android,
      adaptiveIcon: {
        ...appJson.expo.android?.adaptiveIcon,
        foregroundImage: './assets/adaptive-icon.png',
      },
    },

    web: {
      ...appJson.expo.web,
      favicon: './assets/favicon.png',
    },

    extra: {
      ...appJson.expo.extra,
      router: {
        origin: 'localhost:8081',
      },
    },
  },
};
