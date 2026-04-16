import globals from "globals";
import { defineConfig } from "eslint/config";
import pluginJs from "@eslint/js";
import pluginTs from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";

export default defineConfig([
  { ignores: ["dist/*"] },
  {
    basePath: "extension",
    files: ["**/*.@(j|t)s?(x)"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        APP_ENV: "readonly",
        OMDB_API_KEY: "readonly",
      },
    },
  },
  {
    basePath: "extension/dashboard",
    files: ["**/*.@(j|t)s?(x)"],
    ...pluginReact.configs.flat.recommended,
    ...pluginReactHooks.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      ...pluginReactHooks.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    basePath: "extension/popup",
    files: ["**/*.@(j|t)s?(x)"],
    ...pluginReact.configs.flat.recommended,
    ...pluginReactHooks.configs.flat.recommended,
    languageOptions: {
      ...pluginReact.configs.flat.recommended.languageOptions,
      ...pluginReactHooks.configs.flat.recommended.languageOptions,
      globals: {
        ...globals.browser,
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
