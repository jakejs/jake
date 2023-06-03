
module.exports = {
  plugins: [
    'compat',
  ],
  extends: [
    'eslint:recommended',
    'plugin:compat/recommended',
  ],
  env: {
    node: true,
    es6: true
  },
  globals: {
    jake: 'readable',
    task: 'readable',
    namespace: 'readable',
    desc: 'readable',
    complete: 'readable',
    file: 'readable',
    directory: 'readable',
    fail: 'readable',
    test: 'readable',
    suite: 'readable',
    setup: 'readable',
    teardown: 'readable'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'semi': ["error", "always"],
    'indent': ['error', 2],
    'no-console': 'off',
    'no-empty': 'off',
    'no-unused-vars': ['error', { 'args': 'none' }],
    'no-useless-escape': 'off',
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }]
  },
  settings: {
    lintAllEsApis: true,
  }
}
