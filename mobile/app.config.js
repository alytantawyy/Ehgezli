// app.config.js
const appJson = require('./app.json');

module.exports = {
  // spread in everything under "expo" from your static app.json
  expo: {
    ...appJson.expo,

    // Make sure these paths match exactly what's in app.json
    icon: './assets/Ehgezli-logo.png',

    splash: {
      ...appJson.expo.splash,
      image: './assets/Ehgezli-logo.png',
    },

    android: {
      ...appJson.expo.android,
      adaptiveIcon: {
        ...appJson.expo.android?.adaptiveIcon,
        foregroundImage: './assets/Ehgezli-logo.png',
      },
    },

    web: {
      ...appJson.expo.web,
      favicon: './assets/Ehgezli-logo.png', // Match app.json
    },

    extra: {
      ...appJson.expo.extra,
      // Remove the router origin configuration that's causing connection issues
    },
  },
};
