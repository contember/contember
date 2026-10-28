import { describe, expect, test } from 'bun:test'
import { parse } from 'graphql'
import { executeSync, type Schema, TypeKind, TypePattern } from '../src/index.js'

// names deliberately out of alphabetical order: introspection lists everything in the schema order, as graphql-js does
const schema: Schema = {
	q: 'Query',
	m: null,
	s: null,
	t: {
		Query: [TypeKind.OBJECT, {
			zeta: [[TypePattern.T, 'Zed'], { b: [[TypePattern.T, 'Int']], a: [[TypePattern.T, 'Int']] }],
			alpha: [[TypePattern.T, 'Node'], null],
			old: [[TypePattern.T, 'String'], null, undefined, 'gone'],
		}, []],
		Zed: [TypeKind.OBJECT, { id: [[TypePattern.T_NN, 'ID'], null] }, ['Node']],
		Node: [TypeKind.INTERFACE, { id: [[TypePattern.T_NN, 'ID'], null] }, [], ['Alpha', 'Zed']],
		Alpha: [TypeKind.OBJECT, { id: [[TypePattern.T_NN, 'ID'], null] }, ['Node']],
		Either: [TypeKind.UNION, ['Zed', 'Alpha']],
		Color: [TypeKind.ENUM, { RED: [], BLUE: [], GREEN: [undefined, undefined, 'no'] }],
		Input: [TypeKind.INPUT_OBJECT, { z: [[TypePattern.T, 'Int']], a: [[TypePattern.T, 'Int']] }],
		String: [TypeKind.SCALAR],
		Int: [TypeKind.SCALAR],
		ID: [TypeKind.SCALAR],
		Boolean: [TypeKind.SCALAR],
	},
}

const query = `{
	__schema {
		types { name }
		directives { name args { name } }
	}
	query: __type(name: "Query") { fields { name args { name } } all: fields(includeDeprecated: true) { name } }
	node: __type(name: "Node") { possibleTypes { name } }
	either: __type(name: "Either") { possibleTypes { name } }
	color: __type(name: "Color") { enumValues { name } all: enumValues(includeDeprecated: true) { name } }
	input: __type(name: "Input") { inputFields { name } isOneOf }
	zed: __type(name: "Zed") { isOneOf }
}`

describe('introspection order', () => {
	const result = executeSync({ schema, document: parse(query) })

	test('lists types in the schema order', () => {
		expect(result.errors).toBeUndefined()
		expect(result.data).toMatchObject({
			__schema: {
				types: ['Query', 'Zed', 'Node', 'Alpha', 'Either', 'Color', 'Input', 'String', 'Int', 'ID', 'Boolean'].map(name => ({ name }))
					.concat(
						['__Schema', '__Type', '__Field', '__InputValue', '__EnumValue', '__Directive', '__TypeKind', '__DirectiveLocation'].map(name => ({ name })),
					),
			},
		})
	})

	test('lists the specified directives in the graphql-js order', () => {
		expect(result.data).toMatchObject({
			__schema: {
				directives: [
					{ name: 'include', args: [{ name: 'if' }] },
					{ name: 'skip', args: [{ name: 'if' }] },
					{ name: 'deprecated', args: [{ name: 'reason' }] },
					{ name: 'specifiedBy', args: [{ name: 'url' }] },
					{ name: 'oneOf', args: [] },
				],
			},
		})
	})

	test('lists fields, arguments, enum values and input fields in the schema order', () => {
		expect(result.data).toMatchObject({
			query: {
				fields: [{ name: 'zeta', args: [{ name: 'b' }, { name: 'a' }] }, { name: 'alpha', args: [] }],
				all: [{ name: 'zeta' }, { name: 'alpha' }, { name: 'old' }],
			},
			color: { enumValues: [{ name: 'RED' }, { name: 'BLUE' }], all: [{ name: 'RED' }, { name: 'BLUE' }, { name: 'GREEN' }] },
			input: { inputFields: [{ name: 'z' }, { name: 'a' }] },
		})
	})

	test('lists the possible types of an interface as the implementing objects in the schema order', () => {
		expect(result.data).toMatchObject({
			node: { possibleTypes: [{ name: 'Zed' }, { name: 'Alpha' }] },
			either: { possibleTypes: [{ name: 'Zed' }, { name: 'Alpha' }] },
		})
	})

	test('isOneOf is false for an input object and null for other types', () => {
		expect(result.data).toMatchObject({ input: { isOneOf: false }, zed: { isOneOf: null } })
	})
})
