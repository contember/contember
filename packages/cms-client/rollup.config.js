import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
	input: 'dist/tests/index.js',
	output: {
		file: 'dist/tests/bundle.js',
		format: 'cjs',
		sourcemap: false,
	},
	external: ['jasmine'],
	plugins: [
		resolve({
			preferBuiltins: true,
			dedupe: ['react', 'react-dom', 'react-is'],
			// modulesOnly: true
		}),
		commonjs(),
	],
}
