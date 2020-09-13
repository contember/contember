import replace from '@rollup/plugin-replace'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'

export default [
	{
		input: 'dist/src/index.js',
		output: {
			file: 'dist/bundle.js',
			format: 'esm',
			sourcemap: false,
		},
		external: ['react'],
		plugins: [
			replace({
				//__DEV__: 'false',
				'process.env.NODE_ENV': 'production',
			}),
			resolve(),
			commonjs(),
			//terser(),
		],
	},
	{
		input: 'dist/tests/index.js',
		output: {
			file: 'dist/tests/bundle.spec.js',
			format: 'cjs',
			sourcemap: false,
		},
		external: ['react'],
		plugins: [
			replace({
				'process.env.NODE_ENV': JSON.stringify('production'),
			}),
			resolve(),
			commonjs(),
		],
	},
]
