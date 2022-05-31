import { GraphQLScalarType, Kind } from 'graphql'
import { JSONType } from '@contember/graphql-utils'


const uuidPattern = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
/** dashes are optional */
const isUuid = (value: string): boolean => {
	return (
		value.length <= 36 &&
		value.length >= 32 &&
		value.match(uuidPattern) !== null
	)
}

export class CustomTypesProvider {
	public readonly uuidType: GraphQLScalarType = new GraphQLScalarType({
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
