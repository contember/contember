import { describe, expect, test } from 'bun:test'
import * as graphqlJs from 'graphql'
import { parse } from 'graphql'
import { buildSchema, execute, type ResolverMap, S, toGraphQLJsSchema, validate } from '../src/index.js'

// Names of Object.prototype members must behave as any other name the schema does not define.
const sdl = `
	enum Dir { asc desc }
	input Filter { title: String and: [Filter!] }
	input Order { title: Dir }
	type Article { title: String }
	union Result = Article
	type Query {
		list(filter: Filter, orderBy: [Order!], dir: Dir): [Article!]!
		hello: String
		echo(value: String): String
		echoList(values: [String]): [String]
		echoFilter(filter: Filter): String
		badDir: Dir
		result: Result
	}
`

const schema = buildSchema(sdl)
const graphqlJsSchema = graphqlJs.buildSchema(sdl)

const article = { title: 'a' }
const fields = {
	list: () => [article],
	hello: () => 'h',
	echo: (args: Record<string, unknown>) => args.value,
	echoList: (args: Record<string, unknown>) => args.values,
	echoFilter: (args: Record<string, unknown>) => JSON.stringify(args.filter),
	badDir: () => 'toString',
	result: () => ({ __typename: 'constructor' }),
}
const resolvers: ResolverMap = {
	Query: Object.fromEntries(Object.entries(fields).map(([name, resolve]) => [name, (_source, args) => resolve(args)])),
}

const toJson = (value: unknown): unknown => JSON.parse(JSON.stringify(value))

const validationErrors = (query: string) => {
	const document = parse(query)
	return {
		actual: toJson(validate(schema, document)),
		expected: toJson(graphqlJs.validate(graphqlJsSchema, document)),
	}
}

const executionResults = async (query: string, variableValues?: Record<string, unknown>) => {
	const document = parse(query)
	return {
		actual: toJson(await execute({ schema, document, resolvers, variableValues })),
		expected: toJson(await graphqlJs.execute({ schema: graphqlJsSchema, document, rootValue: fields, variableValues })),
	}
}

describe('validation reports prototype member names as graphql-js does', () => {
	const cases: Record<string, string> = {
		'a field': '{ constructor toString __proto__ hasOwnProperty list { valueOf } }',
		'a field argument': '{ list(constructor: 1) { title } }',
		'a directive argument': '{ hello @skip(if: false, toString: 1) }',
		'an input field': '{ list(filter: { constructor: "x", and: [{ __proto__: "y" }] }) { title } }',
		'an enum value': '{ a: list(orderBy: [{ title: toString }]) { title } b: list(dir: constructor) { title } }',
		'a directive': '{ hello @constructor @toString }',
		'a variable type': 'query($v: constructor) { echo(value: $v) }',
		'a fragment type condition': '{ ... on toString { hello } ...F } fragment F on valueOf { hello }',
		'an undefined fragment': '{ ...toString }',
	}
	for (const [name, query] of Object.entries(cases)) {
		test(name, () => {
			const { actual, expected } = validationErrors(query)
			expect(expected).not.toEqual([])
			expect(actual).toEqual(expected)
		})
	}
})

describe('execution of a valid document treats prototype member names as graphql-js does', () => {
	const cases: Record<string, [query: string, variables?: Record<string, unknown>]> = {
		'__type of a prototype member name': ['{ a: __type(name: "constructor") { name } b: __type(name: "toString") { name } }'],
		'__type with the name in a variable': ['query($n: String!) { __type(name: $n) { name } }', { n: 'hasOwnProperty' }],
		'variables without a value': ['query($toString: String) { echo(value: $toString) echoFilter(filter: { title: $toString }) }'],
		'input object variable keys': ['query($f: Filter) { echoFilter(filter: $f) }', { f: { constructor: 'x', and: [{ toString: 'y' }] } }],
		'an own __proto__ key of a variable': ['query($f: Filter) { echoFilter(filter: $f) }', JSON.parse('{"f":{"__proto__":{"title":"x"}}}')],
		'enum variable values': ['query($d: Dir, $o: [Order!]) { list(dir: $d, orderBy: $o) { title } }', { d: 'toString', o: [{ title: 'valueOf' }] }],
		'an enum result': ['{ badDir }'],
		'an abstract type resolved to a prototype member name': ['{ result { __typename } }'],
	}
	for (const [name, [query, variables]] of Object.entries(cases)) {
		test(name, async () => {
			expect(validationErrors(query).actual).toEqual([])
			const { actual, expected } = await executionResults(query, variables)
			expect(actual).toEqual(expected)
		})
	}
})

test('a list item variable without a value is null', async () => {
	// graphql-js reads the missing variable from Object.prototype here and fails to coerce the function
	const document = parse('query($toString: String, $valueOf: String) { echoList(values: [$toString, "x", $valueOf]) }')
	expect(toJson(await execute({ schema, document, resolvers }))).toEqual({ data: { echoList: [null, 'x', null] } })
})

describe('execution of an unvalidated document treats prototype member names as graphql-js does', () => {
	const cases: Record<string, string> = {
		'a field': '{ constructor toString list { valueOf } }',
		'an argument': '{ echo(value: "x", constructor: "y") }',
		'an input field': '{ echoFilter(filter: { title: "x", constructor: "y" }) }',
		'an enum value': '{ list(dir: constructor) { title } }',
		'an undefined fragment': '{ ...toString hello }',
	}
	for (const [name, query] of Object.entries(cases)) {
		test(name, async () => {
			const { actual, expected } = await executionResults(query)
			expect(actual).toEqual(expected)
		})
	}
})

describe('a schema may define prototype member names', () => {
	const ownSdl = `
		enum E { toString valueOf }
		input I { constructor: String }
		type Query {
			toString(valueOf: String): String
			constructor: String
			e(v: E): E
			i(i: I): String
		}
	`
	const ownSchema = buildSchema(ownSdl)
	const ownFields = {
		toString: (args: Record<string, unknown>) => args.valueOf,
		constructor: () => 'c',
		e: (args: Record<string, unknown>) => args.v,
		i: (args: Record<string, unknown>) => JSON.stringify(args.i),
	}
	const ownResolvers: ResolverMap = {
		Query: Object.fromEntries(Object.entries(ownFields).map(([name, resolve]) => [name, (_source, args) => resolve(args)])),
	}
	const run = async (query: string, variableValues?: Record<string, unknown>) =>
		toJson(await execute({ schema: ownSchema, document: parse(query), resolvers: ownResolvers, variableValues }))

	test('as fields, arguments and enum values, as graphql-js does', async () => {
		const query = '{ toString(valueOf: "x") constructor e(v: toString) __type(name: "E") { enumValues { name } } }'
		const document = parse(query)
		const graphqlJsSchema = graphqlJs.buildSchema(ownSdl)
		expect(toJson(validate(ownSchema, document))).toEqual([])
		expect(await run(query)).toEqual(toJson(await graphqlJs.execute({ schema: graphqlJsSchema, document, rootValue: ownFields })))
	})

	test('as an input field a variable leaves out', async () => {
		// graphql-js reads `constructor` of the variable value from Object.prototype here and fails to coerce it
		expect(await run('query($i: I) { i(i: $i) }', { i: {} })).toEqual({ data: { i: '{}' } })
	})

	test('as type names known to the accessors and the graphql-js conversion', () => {
		expect(S.getType(schema, 'constructor')).toBeUndefined()
		const typeNamedLikeMember = buildSchema('type constructor { a: String } type Query { c: constructor }')
		expect(S.getType(typeNamedLikeMember, 'constructor')).toBeDefined()
		expect(graphqlJs.printSchema(toGraphQLJsSchema(typeNamedLikeMember))).toContain('type constructor')
	})
})
