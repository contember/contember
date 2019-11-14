import replace from '@rollup/plugin-replace'
//import analyzer from 'rollup-plugin-analyzer'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import visualizer from 'rollup-plugin-visualizer'

const commonJsConfig = {
	namedExports: {
		['@contember/utils']: ['assertNever', 'arrayDifference', 'isEmptyObject', 'lcfirst', 'ucfirst'],
		react: [
			'Children',
			'cloneElement',
			'Component',
			'createContext',
			'createElement',
			'createFactory',
			'createRef',
			'forwardRef',
			'Fragment',
			'isValidElement',
			'lazy',
			'memo',
			'Profiler',
			'PureComponent',
			'StrictMode',
			'Suspense',
			'useCallback',
			'useContext',
			'useDebugValue',
			'useEffect',
			'useImperativeHandle',
			'useLayoutEffect',
			'useMemo',
			'useReducer',
			'useRef',
			'useState',
		],
		['react-is']: ['isValidElementType', 'isContextConsumer'],
		['react-dom']: [
			'createPortal',
			'findDOMNode',
			'render',
			'unmountComponentAtNode',
			'unstable_batchedUpdates',
			'unstable_renderSubtreeIntoContainer',
		],
		['react-dom/server']: ['renderToStaticMarkup'],
		['prop-types']: ['oneOfType', 'func', 'shape', 'any', 'number', 'object', 'bool', 'string'],
		['../ui/node_modules/prop-types']: ['oneOfType', 'func', 'shape', 'any', 'number', 'object', 'bool', 'string'],
		['regexp-to-ast']: ['RegExpParser', 'VERSION', 'BaseRegExpVisitor'],
		immutable: ['List', 'Record', 'Map', 'Set', 'OrderedSet', 'is'],
		esrever: ['reverse'],
	},
}

const getReplaceConfig = isProd => ({
	//__DEV__: JSON.stringify(isProd ? 'true' : 'false'),
	'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
})

export default [
	{
		input: 'dist/src/index.js',
		output: {
			file: 'dist/bundle.js',
			format: 'esm',
			sourcemap: true,
		},
		external: ['react', 'react-dom'],
		plugins: [
			replace(getReplaceConfig(true)),
			resolve({
				preferBuiltins: true,
				dedupe: ['react', 'react-dom', 'react-is'],
				// modulesOnly: true
			}),
			commonjs(commonJsConfig),
			terser({
				sourcemap: true,
			}),
			visualizer({
				filename: 'dist/bundleStats.html',
				sourcemap: true,
			}),
		],
	},
	{
		input: 'dist/tests/index.js',
		output: {
			file: 'dist/tests/bundle.js',
			format: 'cjs',
			sourcemap: false,
		},
		external: ['jasmine'],
		plugins: [
			replace(getReplaceConfig(false)),
			resolve({
				preferBuiltins: true,
				dedupe: ['react', 'react-dom', 'react-is'],
				// modulesOnly: true
			}),
			commonjs(commonJsConfig),
		],
	},
]
