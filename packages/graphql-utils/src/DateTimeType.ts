import { GraphQLError, GraphQLScalarType, Kind } from 'graphql'

export const DateTimeType = new GraphQLScalarType<Date | null, string | null>({
	name: 'DateTime',
	description: 'DateTime custom scalar type',
	serialize(value) {
		return value instanceof Date ? value.toISOString() : null
	},
	parseValue(value) {
		if (typeof value !== 'string') {
			throw new GraphQLError('DateTime cannot represent a non string value')
		}
		return new Date(value)
	},
	parseLiteral(ast) {
		if (ast.kind === Kind.STRING) {
			return new Date(ast.value)
		}
		return null
	},
})
