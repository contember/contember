import { describe, expect, test } from 'bun:test'
import { getIntrospectionQuery, parse } from 'graphql'
import { buildSchema, executeSync, getSchemaWithIntrospection, introspectionTypes, SchemaInterner, validate } from '../src/index.js'

const sdl = (extraField: string) => `
	"""A directive"""
	directive @tag(name: String = "x") repeatable on FIELD_DEFINITION | OBJECT

	interface Node { id: ID! }

	"""A user"""
	type User implements Node {
		id: ID!
		name(format: String = "short", upper: Boolean): String @deprecated(reason: "use label")
		label: String
		role: Role
		${extraField}
	}

	type Group implements Node { id: ID! }

	union Member = User | Group

	enum Role { ADMIN, EDITOR @deprecated(reason: "gone") }

	input UserFilter @oneOf { id: ID, name: String }

	input Paging { limit: Int = 10, offset: Int }

	scalar DateTime

	type Query {
		user(filter: UserFilter, paging: Paging): User
		members: [Member!]!
		now: DateTime
	}
`

const introspect = (schema: Parameters<typeof executeSync>[0]['schema']) =>
	executeSync({ schema, document: parse(getIntrospectionQuery({ descriptions: true, directiveIsRepeatable: true, inputValueDeprecation: true })) })

describe('SchemaInterner', () => {
	test('an interned schema introspects exactly like the original', () => {
		const schema = buildSchema(sdl(''))
		const interned = new SchemaInterner().intern(schema)
		expect(introspect(interned)).toEqual(introspect(schema))
	})

	test('shares unchanged types between schemas and keeps the changed one apart', () => {
		const interner = new SchemaInterner()
		const first = interner.intern(buildSchema(sdl('')))
		const second = interner.intern(buildSchema(sdl('extra: Int')))

		expect(second.t.Group).toBe(first.t.Group)
		expect(second.t.UserFilter).toBe(first.t.UserFilter)
		expect(second.t.User).not.toBe(first.t.User)
		expect(second.t.Query).toBe(first.t.Query)
		expect(second.d).toBe(first.d)
	})

	test('returns the same schema object for identical schemas', () => {
		const interner = new SchemaInterner()
		expect(interner.intern(buildSchema(sdl('')))).toBe(interner.intern(buildSchema(sdl(''))))
	})

	test('keeps identical types with different names apart', () => {
		const interned = new SchemaInterner().intern(buildSchema('type Query { a: A, b: B } type A { x: Int } type B { x: Int } scalar C scalar D'))
		expect(interned.t.A).not.toBe(interned.t.B)
		expect(interned.t.C).not.toBe(interned.t.D)
		expect(validate(interned, parse('{ b { nope } }')).map(it => it.message)).toEqual(['Cannot query field "nope" on type "B".'])
	})

	test('keeps the introspection types by identity, so execution needs no merged copy', () => {
		const schema = buildSchema(sdl(''))
		const interned = new SchemaInterner().intern({ ...schema, t: { ...schema.t, ...introspectionTypes } })
		expect(interned.t.__Schema).toBe(introspectionTypes.__Schema)
		expect(getSchemaWithIntrospection(interned)).toBe(interned)
		expect(introspect(interned)).toEqual(introspect(schema))
	})
})
