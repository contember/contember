import replace from '@rollup/plugin-replace'
import analyzer from 'rollup-plugin-analyzer'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import { propTypesExportedMembers } from '../../build/exportedMembers/prop-types'
//import { terser } from 'rollup-plugin-terser'

export default {
	input: 'dist/src/index.js',
	output: {
		file: 'dist/bundle.js',
		format: 'esm',
		sourcemap: true,
	},
	external: ['react', 'react-dom'],
	plugins: [
		replace({
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
		//	sourcemap: true,
		//}),
		analyzer(),
	],
}
