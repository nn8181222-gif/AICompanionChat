const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prioritize .ts/.tsx over .js so Metro resolves TypeScript sources first.
// Re-order without removing, so node_module resolution still works.
const sourceExts = config.resolver.sourceExts.filter(
  (ext) => ext !== 'ts' && ext !== 'tsx' && ext !== 'jsx' && ext !== 'js'
);
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', ...sourceExts];

// Instruct Metro NOT to parse Flow types in react-native-web dist files.
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
  },
};

// Use the default Babel transformer but explicitly skip Flow for dist files.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
