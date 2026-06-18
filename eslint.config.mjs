import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/lib/**",
      "**/node_modules/**",
      "**/.firebase/**",
      "**/.emulator-data/**",
      "**/.firebase-emulator-data/**",
      "**/*.cjs",
      "**/*.config.*",
      "eslint.config.mjs",
    ],
  },
  // Plain JS gets the recommended ruleset.
  {
    ...js.configs.recommended,
    files: ["**/*.{js,jsx,mjs}"],
  },
  // TypeScript / TSX: parse with the TS parser and run React Hooks rules.
  // Type-level correctness is enforced by `tsc --noEmit`; ESLint here focuses
  // on hooks correctness and obvious JS mistakes.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Handled by the TypeScript compiler; disable the base rules to avoid
      // false positives on type-only constructs.
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-redeclare": "off",
    },
  },
];
