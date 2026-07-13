const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure .ts/.tsx files from node_modules that are TypeScript declaration sources
// are not parsed as JS modules by Babel.
config.resolver.sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'ts' && ext !== 'tsx'
);
config.resolver.sourceExts.unshift('tsx', 'ts', 'jsx', 'js');

module.exports = config;
