import analyzer from 'rollup-plugin-analyzer'
import replace from '@rollup/plugin-replace'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'

export default {
	input: 'dist/src/index.js',
	output: {
		file: 'dist/bundle.js',
		format: 'es',
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
					'createContext',
					'createElement',
					'Children',
					'Component',
					'forwardRef',
					'Fragment',
					'memo',
					'PureComponent',
					'useLayoutEffect',
					'useEffect',
					'useMemo',
					'useCallback',
					'useContext',
					'useRef',
					'useReducer',
					'useState',
				],
				['react-is']: ['isValidElementType', 'isContextConsumer'],
				['react-dom']: ['createPortal', 'unstable_batchedUpdates', 'findDOMNode'],
				['react-dom/server']: ['renderToStaticMarkup'],
				['prop-types']: ['oneOfType', 'func', 'shape', 'any', 'number', 'object', 'bool', 'string'],
				['regexp-to-ast']: ['RegExpParser', 'VERSION', 'BaseRegExpVisitor'],
				immutable: ['List', 'Record', 'Map', 'Set', 'OrderedSet', 'is'],
				esrever: ['reverse'],
			},
		}),
		terser({
			sourcemap: false,
		}),
		analyzer(),
	],
}
