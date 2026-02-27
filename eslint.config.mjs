import globals from "globals";
import { defineConfig } from "eslint/config";
import pluginJs from "@eslint/js";
import pluginTs from "typescript-eslint";

export default defineConfig([
  { ignores: ["dist/*"] },
  {
    basePath: "extension",
    files: ["**/*.@(j|t)s?(x)"],
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
    files: ["**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    basePath: "tests",
    files: ["**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  pluginJs.configs.recommended,
  ...pluginTs.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
