module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	testMatch: ['<rootDir>/dist/tests/cases/**/*.js'],
	globals: {
		'ts-jest': {
			tsConfig: 'src/tsconfig.json',
		},
	},
}
