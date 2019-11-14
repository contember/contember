import replace from '@rollup/plugin-replace'
//import analyzer from 'rollup-plugin-analyzer'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import visualizer from 'rollup-plugin-visualizer'

export default {
	input: 'dist/src/index.js',
	output: {
		file: 'dist/bundle.js',
		format: 'esm',
		sourcemap: true,
	},
	//external: ['react', 'react-dom'],
	plugins: [
		replace({
			//__DEV__: 'false',
			'process.env.NODE_ENV': 'production',
		}),
		resolve({
			preferBuiltins: true,
			dedupe: ['react', 'react-dom', 'react-is'],
			// modulesOnly: true
		}),
		commonjs({
			namedExports: {
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
		}),
		terser({
			sourcemap: true,
		}),
		visualizer({
			filename: 'dist/bundleStats.html',
			sourcemap: true,
		}),
	],
}
