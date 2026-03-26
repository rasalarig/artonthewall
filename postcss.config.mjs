import unwrapLayer from "./postcss-unwrap-layer.mjs";

const config = {
  plugins: [
    ["@tailwindcss/postcss", {}],
    unwrapLayer,
    [
      "postcss-lightningcss",
      {
        browsers: "defaults, iOS >= 12, Safari >= 12",
      },
    ],
  ],
};

export default config;
