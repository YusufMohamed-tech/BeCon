module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // In this npm-workspaces monorepo, expo-router is nested in the app's own
    // node_modules and is NOT hoisted to the repo root. babel-preset-expo gates
    // its expo-router plugin behind `require.resolve('expo-router')` from the
    // preset's location (repo root), which fails here — so the plugin that
    // inlines EXPO_ROUTER_APP_ROOT never runs and bundling crashes with
    // "First argument of `require.context` should be a string".
    // Adding the plugin explicitly fills that gap.
    plugins: [require('babel-preset-expo/build/expo-router-plugin').expoRouterBabelPlugin],
  };
};

