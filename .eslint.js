
module.exports = {
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
    fail: 'readable'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  extends: 'eslint:recommended',
  rules: {
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
  }
}
