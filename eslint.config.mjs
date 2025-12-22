import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  { ignores: ["dist/*"] },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        BUILDTIME_ENV: "readonly",
      },
    },
  },
  {
    files: ["scripts/**/*.js", "scripts/**/*.cjs", "scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  pluginJs.configs.recommended,
];
