module.exports = {
  languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      }
  },
  rules: {
    semi: ['error', 'always'],
    'no-unused-vars': ['error', { args: 'after-used', vars: 'all', ignoreRestSiblings: false }],
    quotes: ['error', 'single'],
    'comma-dangle': ['error', { arrays: 'always-multiline', objects: 'always-multiline', imports: 'never', exports: 'never', functions: 'never' }]
  }
};
