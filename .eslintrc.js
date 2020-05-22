// Based on https://dev.to/robertcoopercode/using-eslint-and-prettier-in-a-typescript-project-53jb

module.exports =  {
	parser:  '@typescript-eslint/parser',
	extends:  [
		'plugin:@typescript-eslint/recommended',
		'prettier/@typescript-eslint',
		'plugin:prettier/recommended',
	],
	plugins: [],
	parserOptions:  {
		ecmaVersion:  2018,
		sourceType:  'module',
	},
	rules: {
		"no-console": "error",
		"@typescript-eslint/camelcase": "off",
		"@typescript-eslint/explicit-function-return-type": "off",
		"@typescript-eslint/no-empty-interface": "off",
		"@typescript-eslint/no-empty-function": "off",
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-inferrable-types": "off",
		"@typescript-eslint/no-namespace": "off",
		"@typescript-eslint/no-unused-vars": "off",
		"@typescript-eslint/no-use-before-define": "off",

		"prefer-const": "off",
	},
};
