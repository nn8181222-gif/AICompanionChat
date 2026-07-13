module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          // Disable Flow type checking; use TypeScript only.
          // This prevents @babel/parser FlowParserMixin from misidentifying
          // `export { default as X }` as duplicate default exports in
          // react-native-web/dist/index.js
          flow: false,
        },
      ],
    ],
    plugins: [
      '@babel/plugin-transform-export-namespace-from',
    ],
  };
};
