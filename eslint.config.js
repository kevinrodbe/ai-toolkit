// @ts-check
import nxPlugin from '@nx/eslint-plugin';
import tsEslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import json from '@eslint/json';
import prettier from 'eslint-plugin-prettier/recommended';
import packageJsonPlugin from 'eslint-plugin-package-json';
import { jsRules, nxRules, tsRules } from '@rodbe/eslint-config';

export default defineConfig([
  {
    ignores: [
      '**/dist',
      '**/docs',
      '**/coverage',
      '**/*.d.ts',
      '**/node_modules',
      '**/.next',
      '**/out',
      '**/build',
      '.nx',
      'eslint.config.js',
    ],
  },
  {
    extends: [json.configs.recommended],
    files: ['**/*.json'],
    ignores: ['**/package.json', '**/package-lock.json', 'skills-lock.json'],
    language: 'json/json',
    rules: {
      'json/sort-keys': 'error',
    },
  },
  {
    extends: [json.configs.recommended],
    files: ['**/*.jsonc'],
    language: 'json/jsonc',
    rules: {
      'json/sort-keys': 'error',
    },
  },
  {
    extends: [json.configs.recommended],
    files: ['**/*.json5'],
    language: 'json/json5',
    rules: {
      'json/sort-keys': 'error',
    },
  },
  {
    extends: [
      eslint.configs.recommended,
      tsEslint.configs.strictTypeChecked,
      tsEslint.configs.stylisticTypeChecked,
      jsRules,
      tsRules,
    ],
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'spaced-comment': ['error', 'always', { markers: ['/'] }],
    },
  },
  {
    extends: [nxRules],
    files: ['**/*.{ts,tsx,js,jsx}'],
  },
  {
    files: ['**/{layout,page,not-found}.tsx', 'panda.config.ts'],
    rules: {
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            defaultFrom: true,
            named: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },
  ...nxPlugin.configs['flat/base'],
  packageJsonPlugin.configs.recommended,
  prettier,
]);
