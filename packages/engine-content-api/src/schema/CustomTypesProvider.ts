import { GraphQLScalarType, Kind } from 'graphql'
import { JSONType } from '@contember/graphql-utils'

//todo: implement serialize, parseValue and parseLiteral properly

export class CustomTypesProvider {
	public readonly uuidType: GraphQLScalarType
	public readonly dateType: GraphQLScalarType
	public readonly dateTimeType: GraphQLScalarType
	public readonly jsonType: GraphQLScalarType

	constructor() {
		this.uuidType = new GraphQLScalarType({
			name: 'UUID',
			serialize: str => String(str),
			parseValue: str => String(str),
			parseLiteral: function parseLiteral(ast) {
				return ast.kind === Kind.STRING ? ast.value : undefined
			},
		})

		this.dateType = new GraphQLScalarType({
			name: 'Date',
			serialize: str => String(str),
			parseValue: str => String(str),
			parseLiteral: function parseLiteral(ast) {
				return ast.kind === Kind.STRING ? ast.value : undefined
			},
		})

		this.dateTimeType = new GraphQLScalarType({
			name: 'DateTime',
			serialize: str => String(str),
			parseValue: str => String(str),
			parseLiteral: function parseLiteral(ast) {
				return ast.kind === Kind.STRING ? ast.value : undefined
			},
		})
		this.jsonType = JSONType
	}
}
