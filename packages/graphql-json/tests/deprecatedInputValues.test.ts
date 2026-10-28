import { describe, expect, test } from 'bun:test'
import { buildSchema as buildGraphQLJsSchema, graphqlSync, parse } from 'graphql'
import { buildSchema, executeSync } from '../src/index.js'

const sdl = `
	directive @tag(name: String, old: String @deprecated(reason: "Use name")) on FIELD_DEFINITION
	input Filter { old: Int @deprecated(reason: "gone") plain: Int @deprecated empty: Int @deprecated(reason: "") kept: Int }
	type Query { a(x: Int @deprecated(reason: "use y"), y: Int, filter: Filter): Int @tag }
`

const query = `{
	query: __type(name: "Query") {
		fields {
			args { name isDeprecated deprecationReason }
			all: args(includeDeprecated: true) { name isDeprecated deprecationReason }
			current: args(includeDeprecated: false) { name }
		}
	}
	filter: __type(name: "Filter") {
		inputFields { name isDeprecated deprecationReason }
		all: inputFields(includeDeprecated: true) { name isDeprecated deprecationReason }
	}
	__schema {
		directives {
			name
			args { name }
			all: args(includeDeprecated: true) { name isDeprecated deprecationReason }
		}
	}
}`

describe('deprecated arguments and input fields', () => {
	test('introspect as in graphql-js', () => {
		const expected = graphqlSync({ schema: buildGraphQLJsSchema(sdl), source: query })
		const actual = executeSync({ schema: buildSchema(sdl), document: parse(query) })
		expect(expected.errors).toBeUndefined()
		expect(JSON.parse(JSON.stringify(actual))).toEqual(JSON.parse(JSON.stringify(expected)))
	})
})
