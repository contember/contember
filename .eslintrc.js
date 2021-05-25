// Based on https://dev.to/robertcoopercode/using-eslint-and-prettier-in-a-typescript-project-53jb

module.exports = {
	parser: '@typescript-eslint/parser',
	extends: ['plugin:@typescript-eslint/recommended', 'prettier', 'plugin:prettier/recommended'],
	plugins: ['react-hooks', '@typescript-eslint'],
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
	rules: {
		'@typescript-eslint/array-type': 'off',
		'@typescript-eslint/ban-ts-ignore': 'off',
		'@typescript-eslint/ban-types': 'off',
		'@typescript-eslint/camelcase': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-member-accessibility': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-empty-interface': 'off',
		'@typescript-eslint/no-empty-function': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/no-namespace': 'off',
		'@typescript-eslint/no-non-null-assertion': 'off',
		'@typescript-eslint/no-object-literal-type-assertion': 'off',
		'@typescript-eslint/no-parameter-properties': 'off',
		'@typescript-eslint/no-this-alias': 'off',
		'@typescript-eslint/no-unused-vars': 'off',
		'@typescript-eslint/no-use-before-define': 'off',
		'@typescript-eslint/prefer-interface': 'off',

		'prefer-const': 'off',
		'react-hooks/rules-of-hooks': 'error',
		'react-hooks/exhaustive-deps': 'error',

		'no-restricted-syntax': [
			'error',
			{
				selector: 'TSEnumDeclaration',
				message: 'TypeScript enums are banned. Use regular union types instead.',
			},
		],
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
}
