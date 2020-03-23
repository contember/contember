import replace from '@rollup/plugin-replace'
//import analyzer from 'rollup-plugin-analyzer'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
//import { terser } from 'rollup-plugin-terser'
import visualizer from 'rollup-plugin-visualizer'
import { debounceExportedMembers } from '../../build/exportedMembers/debounce'
import { esreverExportedMembers } from '../../build/exportedMembers/esrever'
import { immutableExportedMembers } from '../../build/exportedMembers/immutable'
import { propTypesExportedMembers } from '../../build/exportedMembers/prop-types'
import { reactExportedMembers } from '../../build/exportedMembers/react'
import { reactDomExportedMembers } from '../../build/exportedMembers/react-dom'
import { reactDomServerExportedMembers } from '../../build/exportedMembers/react-dom-server'
import { reactDropzoneExportedMembers } from '../../build/exportedMembers/react-dropzone'
import { reactIsExportedMembers } from '../../build/exportedMembers/react-is'
import { reactPopperExportedMembers } from '../../build/exportedMembers/react-popper'
import { regexpToAstExportedMembers } from '../../build/exportedMembers/regexp-to-ast'
import { bindingExportedMembers } from '../binding/exportedMembers'
import { reactClientMembers } from '../react-client/exportedMembers'
import { utilsExportedMembers } from '../utils/exportedMembers'

const commonJsConfig = {
	namedExports: {
		['@contember/binding']: bindingExportedMembers,
		['@contember/utils']: utilsExportedMembers,
		['@contember/react-client']: reactClientMembers,
		['debounce']: debounceExportedMembers,
		react: reactExportedMembers,
		['react-is']: reactIsExportedMembers,
		['react-dom']: reactDomExportedMembers,
		['react-dom/server']: reactDomServerExportedMembers,
		['react-dropzone']: reactDropzoneExportedMembers,
		['prop-types']: propTypesExportedMembers,
		['../ui/node_modules/react-popper']: reactPopperExportedMembers,
		['../ui/node_modules/prop-types']: propTypesExportedMembers,
		['regexp-to-ast']: regexpToAstExportedMembers,
		immutable: immutableExportedMembers,
		esrever: esreverExportedMembers,
	},
}
const resolveConfig = {
	preferBuiltins: true,
	dedupe: ['react', 'react-dom', 'react-is'],
	customResolveOptions: {
		packageFilter: packageJson => {
			if (
				packageJson.name === '@contember/ui' ||
				packageJson.name === '@contember/react-multipass-rendering' ||
				packageJson.name === '@contember/client' ||
				packageJson.name === '@contember/react-client' ||
				packageJson.name === '@contember/binding'
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
		external: [/*'slate', 'slate-react', 'slate-html-serializer', */ 'react', 'react-dom'],
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
			file: 'dist/tests/bundle.cjs',
			format: 'cjs',
			sourcemap: false,
		},
		external: ['jasmine'],
		plugins: [replace(getReplaceConfig(false)), resolve(resolveConfig), commonjs(commonJsConfig)],
	},
]
