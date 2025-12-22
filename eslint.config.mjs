import globals from "globals";
import { defineConfig } from "eslint/config";
import pluginJs from "@eslint/js";
import pluginTs from "typescript-eslint";

export default defineConfig([
  { ignores: ["dist/*"] },
  {
    basePath: "src",
    files: ["**/*.@(j|t)s"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        BUILDTIME_ENV: "readonly",
      },
    },
  },
  {
    basePath: "scripts",
    files: ["**/*.?(c|m)js"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  pluginJs.configs.recommended,
  ...pluginTs.configs.recommended,
]);
