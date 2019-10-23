// rollup.config.js
import commonjs from 'rollup-plugin-commonjs'

export default {
	input: 'dist/src/index.js',
	output: {
		file: 'dist/bundle.js',
		format: 'cjs',
	},
	plugins: [
		commonjs({
			namedExports: {
				react: [
					'createElement',
					'Component',
					'useLayoutEffect',
					'useEffect',
					'useMemo',
					'useContext',
					'useRef',
					'useReducer',
					'Children',
				],
				['react-is']: ['isValidElementType', 'isContextConsumer'],
				['react-dom']: ['unstable_batchedUpdates', 'findDOMNode'],
				['react-dom/server']: ['renderToStaticMarkup'],
				immutable: ['List', 'Record', 'Map', 'Set', 'OrderedSet', 'is'],
				esrever: ['reverse'],
			},
		}),
	],
}
