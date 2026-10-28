import { describe, expect, it } from 'bun:test'
import { buildSchema as buildGraphQLJsSchema, executeSync as executeSyncWithGraphQLJs, parse } from 'graphql'
import { buildSchema, executeSync } from '../src/index.js'

const sdl = `
	type Query { a: String }
`
const schema = buildSchema(sdl)
const graphqlJsSchema = buildGraphQLJsSchema(sdl)
const rootValue = { a: 'A' }

function expectSameResult(query: string, operationName?: string | null) {
	const document = parse(query)
	const result = executeSync({ schema, document, rootValue, operationName: operationName ?? undefined })
	const graphqlJsResult = executeSyncWithGraphQLJs({ schema: graphqlJsSchema, document, rootValue, operationName })
	expect(JSON.parse(JSON.stringify(result))).toEqual(JSON.parse(JSON.stringify(graphqlJsResult)))
	return expect(JSON.parse(JSON.stringify(result)))
}

describe('operation selection matches graphql-js', () => {
	it('executes the only operation', () => {
		expectSameResult('query Q { a }').toEqual({ data: { a: 'A' } })
	})

	it('selects the named operation', () => {
		expectSameResult('query Q { a } query R { r: a }', 'R').toEqual({ data: { r: 'A' } })
	})

	it('rejects several operations without a name', () => {
		expectSameResult('query Q { a } query R { a }').toEqual({
			errors: [{ message: 'Must provide operation name if query contains multiple operations.' }],
		})
	})

	it('rejects an unknown operation name', () => {
		expectSameResult('query Q { a }', 'R').toEqual({ errors: [{ message: 'Unknown operation named "R".' }] })
	})

	it('treats an empty operation name as a name', () => {
		expectSameResult('{ a }', '').toEqual({ errors: [{ message: 'Unknown operation named "".' }] })
	})

	it('rejects a document without operations', () => {
		expectSameResult('fragment F on Query { a }').toEqual({ errors: [{ message: 'Must provide an operation.' }] })
	})

	it('selects the last of equally named operations', () => {
		expectSameResult('query Q { a } query Q { q: a }', 'Q').toEqual({ data: { q: 'A' } })
	})

	it('rejects an operation type the schema does not define', () => {
		expectSameResult('subscription { a }').toEqual({
			errors: [{ message: 'Schema is not configured to execute subscription operation.', locations: [{ line: 1, column: 1 }] }],
			data: null,
		})
	})
})
