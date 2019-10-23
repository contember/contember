import commonjs from 'rollup-plugin-commonjs'

export default {
	input: 'dist/src/index.js',
	output: {
		file: 'dist/bundle.js',
		format: 'cjs',
	},
	plugins: [commonjs({})],
}
