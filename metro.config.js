// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for all file extensions supported by Expo
config.resolver.assetExts.push(
  // Adds support for `.db` files for SQLite databases
  'db',
  'mp3',
  'ttf',
  'obj',
  'png',
  'jpg',
);

// Add support for React Native web
config.transformer.babelTransformerPath = require.resolve('metro-react-native-babel-transformer');
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

module.exports = config;