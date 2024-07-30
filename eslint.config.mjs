import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { ignores: ["dist/*"] },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.webextensions },
    },
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  pluginJs.configs.recommended,
];
