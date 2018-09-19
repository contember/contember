import { GraphQLScalarType, Kind } from 'graphql'

//todo: implement serialize, parseValue and parseLiteral properly

export const GraphQLUUID: GraphQLScalarType = new GraphQLScalarType({
	name: 'UUID',
	serialize: str => String(str),
	parseValue: str => String(str),
	parseLiteral: function parseLiteral(ast) {
		return ast.kind === Kind.STRING ? ast.value : undefined
	},
})

export const GraphQLDate: GraphQLScalarType = new GraphQLScalarType({
	name: 'Date',
	serialize: str => String(str),
	parseValue: str => String(str),
	parseLiteral: function parseLiteral(ast) {
		return ast.kind === Kind.STRING ? ast.value : undefined
	},
})

export const GraphQLDateTime: GraphQLScalarType = new GraphQLScalarType({
	name: 'DateTime',
	serialize: str => String(str),
	parseValue: str => String(str),
	parseLiteral: function parseLiteral(ast) {
		return ast.kind === Kind.STRING ? ast.value : undefined
	},
})
