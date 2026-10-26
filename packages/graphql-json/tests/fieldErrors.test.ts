import { describe, expect, test } from 'bun:test'
import {
	buildSchema as buildGraphQLJsSchema,
	execute as graphqlJsExecute,
	type ExecutionResult as GraphQLJsExecutionResult,
	GraphQLError,
	GraphQLScalarType,
	GraphQLUnionType,
	parse,
} from 'graphql'
import { buildSchema, execute, type ExecutionResult, type ScalarImplementation } from '../src/index.js'

const sdl = `
	scalar Broken
	type Query {
		graphqlError: String
		locatedGraphqlError: String
		plainError: String
		thrownString: String
		returnedError: String
		nullForNonNull: String!
		nested: Nested!
		list: [String!]
		nullableItems: [String]
		broken: Broken
		throwingTypeResolver: U
		notPossibleType: U
		unknownType: U
	}
	union U = Nested
	type Nested {
		first: String!
		second: String
	}
`

const graphqlError = new GraphQLError('Graphql error', { extensions: { code: 'CUSTOM' } })
const plainError = new Error('Plain error')

const rootValue = {
	graphqlError: () => {
		throw graphqlError
	},
	locatedGraphqlError: () => {
		throw new GraphQLError('Located elsewhere', { nodes: parse('{ elsewhere }').definitions })
	},
	plainError: () => {
		throw plainError
	},
	thrownString: () => {
		throw 'boom'
	},
	returnedError: () => new Error('Returned error'),
	nullForNonNull: () => null,
	nested: () => ({
		first: () => Promise.reject(new Error('first')),
		second: () => new Promise((_, reject) => setTimeout(() => reject(new Error('second')), 5)),
	}),
	list: () => ['a', null, 'c'],
	nullableItems: () => ['a', Promise.reject(new Error('item'))],
	broken: () => 'x',
	throwingTypeResolver: () => ({ resolveAs: null }),
	notPossibleType: () => ({ resolveAs: 'Query' }),
	unknownType: () => ({ resolveAs: 'Missing' }),
}

const resolveU = (value: unknown) => {
	if (typeof value === 'object' && value !== null && 'resolveAs' in value && typeof value.resolveAs === 'string') {
		return value.resolveAs
	}
	throw new Error('Type resolver failed')
}

const brokenSerialize = () => null
const brokenScalar: ScalarImplementation = { serialize: brokenSerialize, parseValue: value => value, parseLiteral: () => undefined }

const graphqlJsSchema = buildGraphQLJsSchema(sdl)
const brokenType = graphqlJsSchema.getType('Broken')
if (brokenType instanceof GraphQLScalarType) {
	brokenType.serialize = brokenSerialize
}
const unionType = graphqlJsSchema.getType('U')
if (unionType instanceof GraphQLUnionType) {
	unionType.resolveType = resolveU
}
const schema = buildSchema(sdl)

const run = async (query: string) => {
	const document = parse(query)
	const expected: GraphQLJsExecutionResult = await graphqlJsExecute({ schema: graphqlJsSchema, document, rootValue })
	const actual: ExecutionResult = await execute({ schema, document, rootValue, scalars: { Broken: brokenScalar }, typeResolvers: { U: resolveU } })
	// let resolvers still running after a non-null error settle, their errors would land in the returned list
	await new Promise(resolve => setTimeout(resolve, 20))
	return { expected, actual }
}

const describeErrors = (errors: readonly GraphQLError[] = []) =>
	errors.map(error => ({ ...error.toJSON(), originalError: error.originalError?.constructor.name }))

describe('field errors match graphql-js', () => {
	const cases: Record<string, string> = {
		'a thrown GraphQLError keeps its extensions': '{ graphqlError }',
		'a thrown GraphQLError keeps its own nodes': '{ locatedGraphqlError }',
		'a thrown Error': '{ plainError }',
		'a thrown non-error value': '{ thrownString }',
		'a returned Error': '{ returnedError }',
		'null for a non-null field': '{ nullForNonNull plainError }',
		'errors under a position already nulled are dropped': '{ nested { first second } }',
		'a null list item': '{ list }',
		'a rejected list item': '{ nullableItems }',
		'a scalar serializing to null': '{ broken }',
		'a throwing type resolver': '{ throwingTypeResolver { __typename } }',
		'a type resolved to a type that is not possible': '{ notPossibleType { __typename } }',
		'a type resolved to an unknown type': '{ unknownType { __typename } }',
	}
	for (const [name, query] of Object.entries(cases)) {
		test(name, async () => {
			const { expected, actual } = await run(query)
			expect(actual.data).toEqual(expected.data ?? null)
			expect(describeErrors(actual.errors)).toEqual(describeErrors(expected.errors))
		})
	}

	test('the thrown error is the original error of the reported one', async () => {
		const { actual } = await run('{ graphqlError plainError }')
		expect(actual.errors?.map(error => error.originalError)).toEqual([graphqlError, plainError])
	})
})
