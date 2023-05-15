export class Literal {
	constructor(public readonly value: string) {
	}
}

export type FormatterPath = ({ type: 'array' } | { type: 'object'; key: string })[]
export type IndentDecider = (value: any, path: FormatterPath) => boolean


export const printJsValue = (value: any, shouldIndentCb: IndentDecider = () => false, path: FormatterPath = []): string => {
	if (value instanceof Literal) {
		return value.value
	}
	if (value === undefined || value === null || typeof value === 'boolean' || typeof value === 'number' || typeof value === 'function') {
		return String(value)
	}
	if (typeof value === 'bigint') {
		return value.toString(10) + 'n'
	}
	if (typeof value === 'string') {
		return `'${value.replaceAll(/'/g, '\\\'')}'`
	}
	const shouldIndent = shouldIndentCb(value, path)
	if (!shouldIndent) {
		shouldIndentCb = () => false
	}

	const indent = (inc: number) => '\t'.repeat(path.length + inc)
	const nl = '\n'

	if (Array.isArray(value)) {
		return  ''
				+ '['
				+ value.map((it, index, arr) =>
					(shouldIndent ? nl + indent(1) : '')
					+ printJsValue(it, shouldIndentCb, [...path, { type: 'array' }])
					+ (shouldIndent ? ',' : ((index + 1) < arr.length ? ', ' : '')),
				).join('')
				+ (shouldIndent ? nl + indent(0) : '')
				+ ']'
	}

	return ''
			+ '{'
			+ (shouldIndent ? '' : ' ')
			+ Object.entries(value).map(([key, value], index, arr) => {
				const formattedKey = isSimpleIdentifier(key) ? key : `[${printJsValue(key)}]`
				return ''
					+ (shouldIndent ? nl + indent(1) : '')
					+ formattedKey
					+ ': '
					+ printJsValue(value, shouldIndentCb, [...path, { type: 'object', key }])
					+ (shouldIndent ? ',' : ((index + 1) < arr.length ? ', ' : ''))
			}).join('')
			+ (shouldIndent ? nl + indent(0) : ' ')
			+ '}'

}

const isSimpleIdentifier = (identifier: string): boolean => {
	return !!identifier.match(/^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/)
}
