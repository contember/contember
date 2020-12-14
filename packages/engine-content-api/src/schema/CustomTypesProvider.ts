import { GraphQLScalarType, Kind } from 'graphql'
import { GraphQLObjectsFactory } from '@contember/graphql-utils'

//todo: implement serialize, parseValue and parseLiteral properly

export class CustomTypesProvider {
	public readonly uuidType: GraphQLScalarType
	public readonly dateType: GraphQLScalarType
	public readonly dateTimeType: GraphQLScalarType

	constructor(private readonly graphqlObjectFactories: GraphQLObjectsFactory) {
		this.uuidType = this.graphqlObjectFactories.createScalarType({
			name: 'UUID',
			serialize: str => String(str),
			parseValue: str => String(str),
			parseLiteral: function parseLiteral(ast) {
				return ast.kind === Kind.STRING ? ast.value : undefined
			},
		})

		this.dateType = this.graphqlObjectFactories.createScalarType({
			name: 'Date',
			serialize: str => String(str),
			parseValue: str => String(str),
			parseLiteral: function parseLiteral(ast) {
				return ast.kind === Kind.STRING ? ast.value : undefined
			},
		})

		this.dateTimeType = this.graphqlObjectFactories.createScalarType({
			name: 'DateTime',
			serialize: str => String(str),
			parseValue: str => String(str),
			parseLiteral: function parseLiteral(ast) {
				return ast.kind === Kind.STRING ? ast.value : undefined
			},
		})
	}
}
