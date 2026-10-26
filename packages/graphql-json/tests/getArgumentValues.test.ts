import { describe, expect, it } from 'bun:test'
import { GraphQLError, Kind, parse } from 'graphql'
import type { FieldNode } from 'graphql'
import { builtInScalars, getArgumentValues, isObjectType, TypeKind, TypePattern, withBuiltInScalars } from '../src/index.js'
import type { Field, ScalarImplementation, Schema } from '../src/index.js'

const dateScalar: ScalarImplementation = {
	serialize: value => value,
	parseValue: value => value,
	parseLiteral: ast => {
		if (ast.kind !== Kind.STRING) {
			throw new Error('Date must be a string')
		}
		return new Date(ast.value)
	},
}

const schema: Schema = {
	q: 'Query',
	m: null,
	s: null,
	t: {
		Query: [
			TypeKind.OBJECT,
			{
				users: [
					[TypePattern.L_NN_T_NN, 'String'],
					{
						filter: [[TypePattern.T_NN, 'UserFilter']],
						limit: [[TypePattern.T, 'Int'], 10],
						status: [[TypePattern.T, 'Status']],
						since: [[TypePattern.T, 'Date']],
					},
				],
			},
			[],
		],
		UserFilter: [TypeKind.INPUT_OBJECT, { name: [[TypePattern.T, 'String']], ids: [[TypePattern.L_T_NN, 'Int']] }],
		Status: [TypeKind.ENUM, { ACTIVE: ['active'], DISABLED: [] }],
		Date: [TypeKind.SCALAR],
		String: [TypeKind.SCALAR],
		Int: [TypeKind.SCALAR],
	},
}

const usersField = (): Field => {
	const query = schema.t.Query
	if (!isObjectType(query)) {
		throw new Error('Query must be an object type')
	}
	return query[1].users
}

const fieldNode = (source: string): FieldNode => {
	const operation = parse(source).definitions[0]
	if (operation.kind !== Kind.OPERATION_DEFINITION) {
		throw new Error('Expected an operation')
	}
	const selection = operation.selectionSet.selections[0]
	if (selection.kind !== Kind.FIELD) {
		throw new Error('Expected a field')
	}
	return selection
}

const scalars = withBuiltInScalars({ Date: dateScalar })

describe('getArgumentValues', () => {
	it('coerces literals, enums, input objects, defaults and custom scalars', () => {
		const node = fieldNode('{ users(filter: { name: "john", ids: 1 }, status: ACTIVE, since: "2020-01-01") }')

		expect(getArgumentValues(schema, usersField(), node, {}, scalars)).toEqual({
			filter: { name: 'john', ids: [1] },
			limit: 10,
			status: 'active',
			since: new Date('2020-01-01'),
		})
	})

	it('takes variable values as given', () => {
		const node = fieldNode('query ($limit: Int, $filter: UserFilter!) { users(filter: $filter, limit: $limit) }')

		expect(getArgumentValues(schema, usersField(), node, { limit: 5, filter: { name: 'x' } }, scalars)).toEqual({
			filter: { name: 'x' },
			limit: 5,
		})
	})

	it('throws when a required argument is missing', () => {
		expect(() => getArgumentValues(schema, usersField(), fieldNode('{ users }'), {}, scalars)).toThrow(
			new GraphQLError('Argument "filter" of required type "UserFilter!" was not provided.'),
		)
	})

	it('rejects an invalid built-in scalar literal', () => {
		const node = fieldNode('{ users(filter: {}, limit: "ten") }')

		expect(() => getArgumentValues(schema, usersField(), node, {}, scalars)).toThrow('Int cannot represent non-integer value: "ten"')
	})

	it('memoizes the merged scalar map per custom scalars object', () => {
		const custom = { Date: dateScalar }

		expect(withBuiltInScalars()).toBe(builtInScalars)
		expect(withBuiltInScalars(custom)).toBe(withBuiltInScalars(custom))
		expect(withBuiltInScalars(custom)).not.toBe(scalars)
		expect(withBuiltInScalars({ Int: dateScalar }).Int).toBe(dateScalar)
	})
})
