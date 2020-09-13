import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default [
	{
		input: 'dist/tests/index.js',
		output: {
			file: 'dist/tests/bundle.js',
			format: 'cjs',
			sourcemap: false,
		},
		plugins: [
			resolve({
				preferBuiltins: true,
			}),
			commonjs(),
		],
	},
	{
		input: 'dist/tests/index.js',
		output: {
			file: 'dist/tests/bundle.spec.js',
			format: 'cjs',
			sourcemap: false,
		},
		plugins: [
			resolve({
				preferBuiltins: true,
			}),
			commonjs(),
		],
	},
]
