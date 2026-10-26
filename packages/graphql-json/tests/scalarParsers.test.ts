import { describe, expect, it } from 'bun:test'
import * as graphqlJs from 'graphql'
import { GraphQLScalarType, Kind, parse } from 'graphql'
import { buildSchema, execute, getArgumentValues, isObjectType, validate, withBuiltInScalars } from '../src/index.js'
import type { Field, ScalarImplementation } from '../src/index.js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

const parseUuid = (value: unknown): string | undefined => (typeof value === 'string' && UUID_PATTERN.test(value) ? value : undefined)

// Returns undefined for a malformed UUID instead of throwing, like a graphql-js scalar may.
const uuidScalarType = new GraphQLScalarType({
	name: 'UUID',
	serialize: value => value,
	parseValue: parseUuid,
	parseLiteral: ast => (ast.kind === Kind.STRING ? parseUuid(ast.value) : undefined),
})

// A graphql-js scalar is a ScalarImplementation as is.
const uuidScalar: ScalarImplementation = uuidScalarType

const sdl = `
	scalar UUID
	input Filter {
		ids: [UUID!]
	}
	type Query {
		node(id: UUID, filter: Filter): String
	}
`

const schema = buildSchema(sdl)
const scalars = { UUID: uuidScalar }
const resolvers = { Query: { node: (_: unknown, args: Record<string, unknown>) => JSON.stringify(args) } }

const graphqlJsSchema = graphqlJs.buildSchema(sdl)
const graphqlJsUuidType = graphqlJsSchema.getType('UUID')
if (!(graphqlJsUuidType instanceof GraphQLScalarType)) {
	throw new Error('UUID must be a scalar')
}
graphqlJsUuidType.parseValue = uuidScalarType.parseValue
graphqlJsUuidType.parseLiteral = uuidScalarType.parseLiteral
const graphqlJsResolvers = { node: (args: Record<string, unknown>) => JSON.stringify(args) }

const VALID_UUID = '123e4567-e89b-12d3-a456-426614174000'

const executeBoth = async (source: string, variableValues?: Record<string, unknown>) => {
	const document = parse(source)
	const ours = await execute({ schema, document, resolvers, scalars, variableValues })
	const theirs = await graphqlJs.execute({ schema: graphqlJsSchema, document, rootValue: graphqlJsResolvers, variableValues })
	return { ours, theirs }
}

const messages = (result: { errors?: readonly { message: string }[] }) => result.errors?.map(it => it.message)

describe('scalar parser returning undefined', () => {
	it('accepts a valid value', async () => {
		const { ours } = await executeBoth('query ($id: UUID) { node(id: $id) }', { id: VALID_UUID })

		expect(ours).toEqual({ data: { node: JSON.stringify({ id: VALID_UUID }) } })
	})

	it('rejects a variable like graphql-js', async () => {
		const { ours, theirs } = await executeBoth('query ($id: UUID) { node(id: $id) }', { id: 'nope' })

		expect(messages(ours)).toEqual(['Variable "$id" got invalid value "nope"; Expected type "UUID".'])
		expect(messages(ours)).toEqual(messages(theirs))
	})

	it('rejects a nested variable value with its path like graphql-js', async () => {
		const { ours, theirs } = await executeBoth('query ($filter: Filter) { node(filter: $filter) }', { filter: { ids: [VALID_UUID, 'nope'] } })

		expect(messages(ours)).toEqual(['Variable "$filter" got invalid value "nope" at "filter.ids[1]"; Expected type "UUID".'])
		expect(messages(ours)).toEqual(messages(theirs))
	})

	it('rejects a literal in validation like graphql-js', () => {
		const document = parse('{ node(id: "nope") }')

		const ours = validate(schema, document, { scalars }).map(it => it.message)
		const theirs = graphqlJs.validate(graphqlJsSchema, document).map(it => it.message)

		expect(ours).toEqual(['Expected value of type "UUID", found "nope".'])
		expect(ours).toEqual(theirs)
	})

	it('rejects a literal argument in execution like graphql-js', async () => {
		const { ours, theirs } = await executeBoth('{ node(filter: { ids: ["nope"] }) }')

		expect(ours).toEqual({ data: { node: null }, errors: [expect.anything()] })
		expect(messages(ours)).toEqual(['Argument "filter" has invalid value {ids: ["nope"]}.'])
		expect(messages(ours)).toEqual(messages(theirs))
	})

	it('rejects a literal argument in getArgumentValues', () => {
		const query = schema.t.Query
		if (!isObjectType(query)) {
			throw new Error('Query must be an object type')
		}
		const nodeField: Field = query[1].node
		const operation = parse('{ node(id: "nope") }').definitions[0]
		if (operation.kind !== Kind.OPERATION_DEFINITION || operation.selectionSet.selections[0].kind !== Kind.FIELD) {
			throw new Error('Expected a field selection')
		}
		const fieldNode = operation.selectionSet.selections[0]

		expect(() => getArgumentValues(schema, nodeField, fieldNode, {}, withBuiltInScalars(scalars))).toThrow(
			'Argument "id" has invalid value "nope".',
		)
	})
})
