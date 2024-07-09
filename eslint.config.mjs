import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: ["**/node_modules/", "**/dist/"],
  },
  ...compat.extends("eslint:recommended"),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    rules: {
      curly: [1, "multi-line"],
      indent: [2, 2],
      quotes: [2, "double"],
      "linebreak-style": [2, "unix"],
      semi: [2, "always"],
      "no-console": [0],
    },
  },
  ...compat.extends("plugin:jest/recommended").map((config) => ({
    ...config,
    files: ["**/*.test.js"],
  })),
];
