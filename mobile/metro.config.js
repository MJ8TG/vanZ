const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;

// Custom resolver to redirect react-native and react-native-maps on Web, preserving original resolver
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    if (moduleName === 'react-native') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'react-native-web-compat.js'),
      };
    }
    if (moduleName === 'react-native-maps') {
      return {
        type: 'sourceFile',
        filePath: path.resolve(__dirname, 'react-native-maps-mock.js'),
      };
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css' });
