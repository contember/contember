import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript'

export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/bundle.js',
		format: 'es',
	},
	external: ['react'],
	plugins: [
		resolve(),
		commonjs(),
		typescript({
			tsconfig: './../../tsconfig.settings.json', // It cannot resolve references by default.
		}),
	],
}
