import replace from '@rollup/plugin-replace'
//import analyzer from 'rollup-plugin-analyzer'
import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
//import { terser } from 'rollup-plugin-terser'
import visualizer from 'rollup-plugin-visualizer'
import { reactExportedMembers } from '../../build/exportedMembers/react'
import { reactClientMembers } from '../react-client/exportedMembers'
import { reactUtilsMembers } from '../react-utils/exportedMembers'

const commonJsConfig = {
	namedExports: {
		['@contember/react-client']: reactClientMembers,
		['@contember/react-utils']: reactUtilsMembers,
		react: reactExportedMembers,
	},
}
const resolveConfig = {
	preferBuiltins: true,
	dedupe: ['react', 'react-dom'],
	customResolveOptions: {
		packageFilter: packageJson => {
			if (
				packageJson.name === '@contember/react-multipass-rendering' ||
				packageJson.name === '@contember/client' ||
				packageJson.name === '@contember/react-client'
			) {
				return {
					...packageJson,
					main: 'dist/src/index.js',
				}
			}
			return packageJson
		},
	},
	// modulesOnly: true
}

const getReplaceConfig = isProd => ({
	__DEV_MODE__: JSON.stringify(!isProd),
	'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
})

export default [
	{
		input: 'dist/src/index.js',
		output: {
			file: 'dist/bundle.js',
			format: 'esm',
			sourcemap: false,
		},
		external: ['react', 'react-dom'],
		plugins: [
			replace(getReplaceConfig(true)),
			resolve(resolveConfig),
			commonjs(commonJsConfig),
			//terser({
			//	sourcemap: false,
			//}),
			visualizer({
				filename: 'dist/bundleStats.html',
				sourcemap: false,
			}),
		],
	},
	{
		input: 'dist/tests/index.js',
		output: {
			file: 'dist/tests/bundle.spec.js',
			format: 'cjs',
			sourcemap: false,
		},
		plugins: [replace(getReplaceConfig(false)), resolve(resolveConfig), commonjs(commonJsConfig)],
	},
]
