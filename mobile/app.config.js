// Basic Expo configuration that focuses on fixing asset paths
const config = require('./app.json');

// Override the asset paths to ensure they work correctly
module.exports = {
  ...config.expo,
  icon: "./assets/icon.png",
  splash: {
    ...config.expo.splash,
    image: "./assets/splash-icon.png"
  },
  android: {
    ...config.expo.android,
    adaptiveIcon: {
      ...config.expo.android?.adaptiveIcon,
      foregroundImage: "./assets/adaptive-icon.png"
    }
  },
  web: {
    ...config.expo.web,
    favicon: "./assets/favicon.png"
  },
  // Force the app to use localhost for development
  extra: {
    ...config.expo.extra,
    router: {
      origin: "localhost:8081"
    }
  }
};
