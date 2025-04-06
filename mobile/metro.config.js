// Learn more https://docs.expo.io/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('@expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const defaultConfig = getDefaultConfig(__dirname);

// Merge with the default config
const config = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    assetExts: [...defaultConfig.resolver.assetExts, 'png', 'jpg', 'jpeg', 'gif', 'svg'],
    // Add this to fix the missing-asset-registry-path error
    extraNodeModules: {
      'missing-asset-registry-path': path.resolve(__dirname, 'node_modules/react-native/Libraries/Image/AssetRegistry')
    }
  },
  transformer: {
    ...defaultConfig.transformer,
    assetPlugins: ['expo-asset/tools/hashAssetFiles']
  },
  server: {
    port: 8081
  },
  watchFolders: [
    path.resolve(__dirname, 'assets'),
    path.resolve(__dirname, 'assets/images'),
    path.resolve(__dirname, 'node_modules')
  ]
};

module.exports = config;
