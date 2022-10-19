import { GraphQLScalarType, Kind } from 'graphql'
import { JSONType, UuidType } from '@contember/graphql-utils'


export class CustomTypesProvider {
	public readonly uuidType: GraphQLScalarType = UuidType

	//todo: implement serialize, parseValue and parseLiteral properly
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
