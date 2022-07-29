import { PredicateFactory, PredicatesInjector, VariableInjector } from '../../../src/acl'
import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { describe, it, assert } from 'vitest'



const schema = new SchemaBuilder()
	.enum('locale', ['cs', 'en'])
	.entity('Post', entityBuilder => entityBuilder.oneHasMany('locales', c => c.target('PostLocale')))
	.entity('PostLocale', entity =>
		entity
			.column('title', column => column.type(Model.ColumnType.String))
			.column('content', column => column.type(Model.ColumnType.String))
			.column('locale', column => column.type(Model.ColumnType.Enum, { enumName: 'locale' })),
	)
	.buildSchema()

const permissions: Acl.Permissions = {
	Post: {
		predicates: {},
		operations: {
			read: {
				id: true,
				locales: true,
			},
		},
	},
	PostLocale: {
		predicates: {
			localePredicate: {
				locale: 'localeVariable',
			},
			localePredicate2: {
				locale: 'localeVariable',
			},
		},
		operations: {
			read: {
				id: 'localePredicate',
				title: 'localePredicate2',
				content: 'localePredicate',
			},
		},
	},
}

describe('Predicates injector', () => {

	const variables: Acl.VariablesMap = {
		localeVariable: { in: ['cs'] },
	}
	it('injects predicate', () => {
		const injector = new PredicatesInjector(
			schema,
			new PredicateFactory(permissions, schema, new VariableInjector(schema, variables)),
		)
		const result = injector.inject(schema.entities['PostLocale'], {})

		assert.deepStrictEqual(result, {
			locale: { in: ['cs'] },
		})
	})

	it('merges predicate with explicit where', () => {
		const injector = new PredicatesInjector(
			schema,
			new PredicateFactory(permissions, schema, new VariableInjector(schema, variables)),
		)
		const result = injector.inject(schema.entities['PostLocale'], { id: { in: [1, 2] } })

		assert.deepStrictEqual(result, {
			and: [
				{
					id: { in: [1, 2] },
				},
				{
					locale: { in: ['cs'] },
				},
			],
		})
	})

	it('injects predicate to where', () => {
		const injector = new PredicatesInjector(
			schema,
			new PredicateFactory(permissions, schema, new VariableInjector(schema, variables)),
		)

		const result = injector.inject(schema.entities['PostLocale'], { title: { eq: 'abc' } })

		assert.deepStrictEqual(result, {
			and: [
				{
					and: [
						{
							title: { eq: 'abc' },
						},
						{
							locale: { in: ['cs'] },
						},
					],
				},
				{
					locale: { in: ['cs'] },
				},
			],
		})
	})
})

