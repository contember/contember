import { GraphQLScalarType, Kind } from 'graphql'
import { JSONType } from '@contember/graphql-utils'
import { singletonFactory } from '../utils'

//todo: implement serialize, parseValue and parseLiteral properly

export class CustomTypesProvider {
	public readonly uuidType: GraphQLScalarType = new GraphQLScalarType({
		name: 'UUID',
		serialize: str => String(str),
		parseValue: str => String(str),
		parseLiteral: function parseLiteral(ast) {
			return ast.kind === Kind.STRING ? ast.value : undefined
		},
	})

	public readonly dateType: GraphQLScalarType = new GraphQLScalarType({
		name: 'Date',
		serialize: str => String(str),
		parseValue: str => String(str),
		parseLiteral: function parseLiteral(ast) {
			return ast.kind === Kind.STRING ? ast.value : undefined
		},
	})
	public readonly dateTimeType: GraphQLScalarType = new GraphQLScalarType({
		name: 'DateTime',
		serialize: str => String(str),
		parseValue: str => String(str),
		parseLiteral: function parseLiteral(ast) {
			return ast.kind === Kind.STRING ? ast.value : undefined
		},
	})
	public readonly jsonType: GraphQLScalarType = JSONType
}
