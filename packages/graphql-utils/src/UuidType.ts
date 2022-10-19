import { GraphQLScalarType, Kind } from 'graphql'

const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
/** dashes are optional */
const isUuid = (value: string): boolean => {
	return (
		value.length <= 36 &&
		value.length >= 32 &&
		value.match(uuidPattern) !== null
	)
}

export const UuidType = new GraphQLScalarType({
	name: 'UUID',
	serialize: str => String(str),
	parseValue: str => {
		if (typeof str !== 'string' || !isUuid(str)) {
			return undefined
		}
		return str
	},
	parseLiteral: function parseLiteral(ast) {
		if (ast.kind !== Kind.STRING || !isUuid(ast.value)) {
			return undefined
		}
		return ast.value
	},
})
