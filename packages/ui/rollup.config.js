//import analyzer from 'rollup-plugin-analyzer'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript'
import globalTsconfig from './../../tsconfig.settings.json'

export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/bundle.js',
		format: 'es',
	},
	external: ['react', 'react-dom'],
	plugins: [
		resolve({
			preferBuiltins: true,
			dedupe: ['react', 'react-dom', 'react-is'],
			// modulesOnly: true
		}),
		commonjs({
			namedExports: {
				['prop-types']: ['oneOfType', 'func', 'shape', 'any', 'number', 'object', 'bool', 'string'],
			},
		}),
		typescript({
			...globalTsconfig.compilerOptions,
			jsx: 'react',
		}),
		// analyzer(),
	],
}
