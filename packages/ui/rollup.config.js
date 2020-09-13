import replace from '@rollup/plugin-replace'
//import analyzer from 'rollup-plugin-analyzer'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { propTypesExportedMembers } from '../../build/exportedMembers/prop-types'
//import { terser } from 'rollup-plugin-terser'

export default {
	input: 'dist/src/index.js',
	output: {
		file: 'dist/bundle.js',
		format: 'esm',
		sourcemap: false,
	},
	dedupe: ['react', 'react-dom', 'react-is'],
	external: ['react', 'react-dom'],
	plugins: [
		replace({
			__DEV_MODE__: JSON.stringify(false),
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		resolve({
			preferBuiltins: true,
			dedupe: ['react', 'react-dom', 'react-is'],
			// modulesOnly: true
		}),
		commonjs({
			namedExports: {
				['prop-types']: propTypesExportedMembers,
			},
		}),
		//terser({
		//	sourcemap: false,
		//}),
		//analyzer(),
	],
}
