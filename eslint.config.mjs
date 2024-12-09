import js from "@eslint/js";
import globals from "globals";

export default [js.configs.recommended, {
  languageOptions: {
    globals: {
      ...globals.node,
      jake: "readable",
      task: "readable",
      namespace: "readable",
      desc: "readable",
      complete: "readable",
      file: "readable",
      directory: "readable",
      fail: "readable",
      test: "readable",
      suite: "readable",
      setup: "readable",
      teardown: "readable",
    },

    ecmaVersion: 2018,
    sourceType: "module",
  },

  rules: {
    semi: ["error", "always"],
    indent: ["error", 2],
    "no-console": "off",
    "no-empty": "off",

    "no-unused-vars": ["error", {
      args: "none",
      caughtErrors: "none",
    }],

    "no-useless-escape": "off",

    "space-before-function-paren": ["error", {
      anonymous: "always",
      named: "never",
      asyncArrow: "always",
    }],
  },
}];