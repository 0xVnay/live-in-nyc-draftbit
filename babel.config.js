module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // `unstable_transformImportMeta` rewrites `import.meta` at build time.
      // Without it the web export (a classic <script>, not a module) hits a hard
      // parse error — "Cannot use 'import.meta' outside a module" — on deps that
      // use the Vite-only `import.meta.env` (e.g. zustand's devtools middleware,
      // pulled in via the `zustand/middleware` barrel), crashing the whole app.
      // This is Expo's first-party fix and becomes the default in SDK 56.
      [
        "babel-preset-expo",
        { jsxImportSource: "nativewind", unstable_transformImportMeta: true },
      ],
      "nativewind/babel",
    ],
  };
};
