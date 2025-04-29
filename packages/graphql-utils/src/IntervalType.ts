import { GraphQLScalarType, Kind } from 'graphql'

const is8601Interval = (str: string) => {
	const regex = /^(P(\d+Y)?(\d+M)?(\d+W)?(\d+D)?)?(T(?=\d)(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/
	return regex.test(str)
}

const shortenInterval = (str: string) => {
	const shorten = str.replace(/(?<=[YMWDHSPT])0+[YMWDHS]/g, '')
	if (shorten === 'PT' || shorten === 'P') {
		return 'PT0S'
	}
	if (shorten.endsWith('T')) {
		return shorten.slice(0, -1)
	}
	return shorten
}


export const IntervalType = new GraphQLScalarType({
	name: 'Interval',
	serialize: str => {
		if (typeof str === 'object' && str !== null && 'toISOString' in str) {
			return shortenInterval((str.toISOString as any)())
		}
		return String(str)
	},
	parseValue: str => {
		if (typeof str !== 'string' || !is8601Interval(str)) {
			return undefined
		}
		return str
	},
	parseLiteral: function parseLiteral(ast) {
		if (ast.kind !== Kind.STRING || !is8601Interval(ast.value)) {
			return undefined
		}
		return ast.value
	},
})
