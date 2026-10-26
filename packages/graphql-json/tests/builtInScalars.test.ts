import { describe, expect, test } from 'bun:test'
import { GraphQLBoolean, GraphQLError, GraphQLFloat, GraphQLID, GraphQLInt, type GraphQLScalarType, GraphQLString, parseValue } from 'graphql'
import { builtInScalars, type ScalarImplementation } from '../src/index.js'

const graphqlJsScalars: Record<string, GraphQLScalarType> = {
	Int: GraphQLInt,
	Float: GraphQLFloat,
	String: GraphQLString,
	Boolean: GraphQLBoolean,
	ID: GraphQLID,
}

/** The result of a coercion, or the error it threw with what a response would carry of it */
const outcome = (fn: () => unknown) => {
	try {
		return { value: fn() }
	} catch (error) {
		return { isGraphQLError: error instanceof GraphQLError, error: error instanceof GraphQLError ? error.toJSON() : String(error) }
	}
}

const runtimeValues: unknown[] = [
	0,
	1,
	-1.5,
	2 ** 31,
	Number.NaN,
	Infinity,
	'',
	'12',
	'abc',
	true,
	false,
	null,
	undefined,
	{},
	[1],
	{ valueOf: () => 5 },
	{ valueOf: () => null },
	{ valueOf: () => ({}), toJSON: () => 'json' },
	new Date(0),
]

const literals = ['1', '2147483648', '1.5', '"text"', '"""block"""', 'true', 'null', 'ENUM', '[1]', '{ a: 1 }']

const describeImplementation = (name: string, ours: ScalarImplementation, theirs: GraphQLScalarType) => {
	describe(name, () => {
		test('serialize', () => {
			for (const value of runtimeValues) {
				expect(outcome(() => ours.serialize(value))).toEqual(outcome(() => theirs.serialize(value)))
			}
		})
		test('parseValue', () => {
			for (const value of runtimeValues) {
				expect(outcome(() => ours.parseValue(value))).toEqual(outcome(() => theirs.parseValue(value)))
			}
		})
		test('parseLiteral', () => {
			for (const literal of literals) {
				const node = parseValue(literal)
				expect(outcome(() => ours.parseLiteral(node))).toEqual(outcome(() => theirs.parseLiteral(node, undefined)))
			}
		})
	})
}

describe('built-in scalars match graphql-js', () => {
	for (const [name, implementation] of Object.entries(builtInScalars)) {
		const graphqlJsScalar = graphqlJsScalars[name]
		if (graphqlJsScalar) {
			describeImplementation(name, implementation, graphqlJsScalar)
		}
	}
})
