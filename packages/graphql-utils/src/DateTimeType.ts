import { GraphQLScalarType, Kind } from 'graphql'

export const DateTimeType = new GraphQLScalarType({
	name: 'DateTime',
	description: 'DateTime custom scalar type',
	serialize(value) {
		return value instanceof Date ? value.toISOString() : null
	},
	parseValue(value) {
		return new Date(value)
	},
	parseLiteral(ast) {
		if (ast.kind === Kind.STRING) {
			return new Date(ast.value)
		}
		return null
	},
})
