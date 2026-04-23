module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    'prefer-const': 'error',
    'react/no-unescaped-entities': 'error',
    'react-hooks/set-state-in-effect': 'off',
  },
}




