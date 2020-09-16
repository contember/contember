import { JSONValue } from './json'
import { GraphQLScalarType, Kind, ValueNode } from 'graphql'
import Maybe from 'graphql/tsutils/Maybe'

export const JSONType = new GraphQLScalarType({
	name: 'Json',
	description: 'Json custom scalar type',
	serialize(value) {
		return value
	},
	parseValue(value) {
		return value
	},
	parseLiteral(ast, variables) {
		const parseLiteral = (ast: ValueNode, variables: Maybe<{ [key: string]: any }>): JSONValue => {
			switch (ast.kind) {
				case Kind.STRING:
					return ast.value
				case Kind.BOOLEAN:
					return ast.value
				case Kind.FLOAT:
					return parseFloat(ast.value)
				case Kind.INT:
					return Number(ast.value)
				case Kind.LIST:
					return ast.values.map(it => parseLiteral(it, variables))
				case Kind.OBJECT:
					return Object.fromEntries(ast.fields.map(it => [it.name.value, parseLiteral(it.value, variables)]))
				case Kind.NULL:
					return null
				case Kind.VARIABLE:
					return variables?.[ast.name.value] || undefined
				default:
					throw new TypeError()
			}
		}
		return parseLiteral(ast, variables)
	},
})
