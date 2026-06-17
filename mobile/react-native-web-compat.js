const ReactNativeWeb = require('react-native-web');

const compat = {};

// Proxy all properties of react-native-web, preserving getters
Object.defineProperties(compat, Object.getOwnPropertyDescriptors(ReactNativeWeb));

// Add missing native codegen mock exports for web compatibility
compat.codegenNativeComponent = (name) => name;
compat.codegenNativeCommands = () => ({});

module.exports = compat;
