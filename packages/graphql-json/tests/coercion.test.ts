import { describe, expect, test } from 'bun:test'
import * as graphqlJs from 'graphql'
import { parse } from 'graphql'
import { buildSchema, execute } from '../src/index.js'

const sdl = `
	enum Color { RED GREEN BLUE }
	input Point { x: Int! y: Int = 0 }
	input Filter { name: String color: Color points: [Point!] tags: [String] nested: Filter }
	input Choice @oneOf { a: Int b: String }
	type Query {
		echo(
			int: Int
			requiredInt: Int!
			float: Float
			color: Color
			colors: [Color!]
			filter: Filter
			choice: Choice
			id: ID
			defaulted: String = "default"
		): String
	}
`

const schema = buildSchema(sdl)
const graphqlJsSchema = graphqlJs.buildSchema(sdl)
// argument values serialized with their keys in order, so a missing key differs from an undefined one
const echo = (args: Record<string, unknown>) => JSON.stringify(args, (_, value) => (value === undefined ? '<undefined>' : value))
const resolvers = { Query: { echo: (_: unknown, args: Record<string, unknown>) => echo(args) } }

const run = async (query: string, variableValues?: Record<string, unknown>) => {
	const document = parse(query)
	const expected = await graphqlJs.execute({ schema: graphqlJsSchema, document, rootValue: { echo }, variableValues })
	const actual = await execute({ schema, document, resolvers, variableValues })
	return { expected: JSON.parse(JSON.stringify(expected)), actual: JSON.parse(JSON.stringify(actual)) }
}

describe('variable coercion matches graphql-js', () => {
	const cases: Record<string, [query: string, variables: Record<string, unknown>]> = {
		'wrong scalar type': ['query($v: Int) { echo(requiredInt: 1, int: $v) }', { v: 'x' }],
		'required variable not provided': ['query($v: Int!) { echo(requiredInt: $v) }', {}],
		'null for a non-null variable': ['query($v: Int!) { echo(requiredInt: $v) }', { v: null }],
		'default value of a variable': ['query($v: Color = GREEN) { echo(requiredInt: 1, color: $v) }', {}],
		'list of one from a single value': ['query($v: [Color!]) { echo(requiredInt: 1, colors: $v) }', { v: 'RED' }],
		'invalid enum value with a suggestion': ['query($v: Color) { echo(requiredInt: 1, color: $v) }', { v: 'GREN' }],
		'non-string enum value': ['query($v: Color) { echo(requiredInt: 1, color: $v) }', { v: 1 }],
		'nested errors with paths': [
			'query($v: Filter) { echo(requiredInt: 1, filter: $v) }',
			{ v: { name: 1, colr: 'RED', points: [{ x: 1 }, { y: 2 }, null], nested: { tags: [1, 'a'] } } },
		],
		'input object defaults': ['query($v: Filter) { echo(requiredInt: 1, filter: $v) }', { v: { points: [{ x: 1 }] } }],
		'not an object': ['query($v: Filter) { echo(requiredInt: 1, filter: $v) }', { v: [1] }],
		'oneOf with two keys': ['query($v: Choice) { echo(requiredInt: 1, choice: $v) }', { v: { a: 1, b: 'x' } }],
		'oneOf with a null value': ['query($v: Choice) { echo(requiredInt: 1, choice: $v) }', { v: { a: null } }],
		'unknown variable type': ['query($v: Nope) { echo(requiredInt: 1) }', { v: 1 }],
		'too many errors': [
			'query($v: [Int]) { echo(requiredInt: 1, int: 1) }',
			{ v: Array.from({ length: 60 }, () => 'x') },
		],
	}
	for (const [name, [query, variables]] of Object.entries(cases)) {
		test(name, async () => {
			const { expected, actual } = await run(query, variables)
			expect(actual).toEqual(expected)
		})
	}
})

describe('argument coercion matches graphql-js', () => {
	const cases: Record<string, [query: string, variables?: Record<string, unknown>]> = {
		'literals of each type': ['{ echo(requiredInt: 1, float: 2, color: RED, colors: BLUE, id: 3, filter: { name: "n", tags: "t" }) }'],
		'a missing variable inside an object is left out': ['query($n: String) { echo(requiredInt: 1, filter: { name: $n, color: RED }) }', {}],
		'a missing variable inside a list is null': ['query($n: String) { echo(requiredInt: 1, filter: { tags: ["a", $n] }) }', {}],
		'a missing variable falls back to the default': ['query($n: String) { echo(requiredInt: 1, defaulted: $n) }', {}],
		'a null variable for a non-null argument': ['query($n: Int) { echo(requiredInt: $n) }', { n: null }],
		'a missing variable for a non-null argument': ['query($n: Int) { echo(requiredInt: $n) }', {}],
		'an invalid literal': ['{ echo(requiredInt: "x") }'],
		'an invalid enum literal': ['{ echo(requiredInt: 1, color: "RED") }'],
		'a oneOf literal': ['{ echo(requiredInt: 1, choice: { b: "x" }) }'],
	}
	for (const [name, [query, variables]] of Object.entries(cases)) {
		test(name, async () => {
			const { expected, actual } = await run(query, variables)
			expect(actual).toEqual(expected)
		})
	}
})
