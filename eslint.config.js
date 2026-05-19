// @ts-check
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import eslint from '@eslint/js';
import json from '@eslint/json';
import tslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier/recommended';
import packageJson from 'eslint-plugin-package-json';
import nxPlugin from '@nx/eslint-plugin';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default tslint.config(
	{ ignores: ['**/dist/', '**/results/', '**/docs/', '**/coverage/', '**/*.d.ts'] },
	prettier,
	packageJson.configs.recommended,
	{
		files: ['**/*.json'],
		ignores: ['**/package-lock.json', '**/package.json'],
		language: 'json/json',
		...json.configs.recommended,
		rules: {
			...json.configs.recommended.rules,
			'json/sort-keys': 'error',
		},
	},
	{
		extends: [eslint.configs.recommended, tslint.configs.recommended, tslint.configs.stylistic],
		files: ['**/*.js', '**/*.ts'],
		languageOptions: {
			ecmaVersion: 'latest',
			parserOptions: {
				project: ['./tsconfig.json', './packages/**/tsconfig.json'],
				tsconfigRootDir: __dirname,
			},
			sourceType: 'module',
		},
		rules: {
			'@typescript-eslint/no-explicit-any': ['error', { fixToUnknown: true }],
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
				},
			],
			'sort-imports': [
				'error',
				{
					allowSeparatedGroups: true,
					ignoreCase: false,
					ignoreDeclarationSort: true,
					ignoreMemberSort: false,
					memberSyntaxSortOrder: ['none', 'all', 'single', 'multiple'],
				},
			],
			'sort-keys': [
				'error',
				'asc',
				{
					caseSensitive: false,
					minKeys: 2,
					natural: false,
				},
			],
		},
	},
	{
		plugins: {
			'@nx': nxPlugin,
		},
	}
);
