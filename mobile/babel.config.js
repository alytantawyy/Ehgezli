module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Enable JSX syntax
      '@babel/plugin-syntax-jsx',
      // Support for React Native Reanimated
      'react-native-reanimated/plugin'
      // Removed expo-router/babel as it's deprecated in SDK 50
    ],
  };
};
