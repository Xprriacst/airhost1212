import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'coverage/**/*', '**/*.d.ts']
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        process: 'readonly',
        global: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setImmediate: 'readonly',
        navigator: 'readonly',
        MessageChannel: 'readonly',
        AbortController: 'readonly',
        MSApp: 'readonly',
        Iterator: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-undef': 'error',
      'no-unused-vars': 'off', // On utilise la règle TypeScript à la place
      'no-empty': 'warn',
      'no-prototype-builtins': 'warn',
      'no-constant-condition': 'warn',
      'no-useless-escape': 'warn',
      'no-fallthrough': 'warn',
      'no-control-regex': 'off',
      'no-misleading-character-class': 'warn',
      'getter-return': 'error',
      'no-redeclare': 'error',
      'valid-typeof': 'error',
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];
