import VariableInjector from '../../../src/acl/VariableInjector'
import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import PredicatesInjector from '../../../src/acl/PredicatesInjector'
import PredicateFactory from '../../../src/acl/PredicateFactory'
import * as assert from 'uvu/assert'
import { suite } from 'uvu'
const predicateInjectorTest = suite('Predicates injector')

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
		},
		operations: {
			read: {
				id: 'localePredicate',
				title: 'localePredicate',
				content: 'localePredicate',
			},
		},
	},
}

predicateInjectorTest('injects predicate', () => {
	const injector = new PredicatesInjector(
		schema,
		new PredicateFactory(permissions, new VariableInjector(schema, { localeVariable: ['cs'] })),
	)
	const result = injector.inject(schema.entities['PostLocale'], {})

	assert.equal(result, {
		locale: { in: ['cs'] },
	})
})

predicateInjectorTest('merges predicate with explicit where', () => {
	const injector = new PredicatesInjector(
		schema,
		new PredicateFactory(permissions, new VariableInjector(schema, { localeVariable: ['cs'] })),
	)
	const result = injector.inject(schema.entities['PostLocale'], { id: { in: [1, 2] } })

	assert.equal(result, {
		and: [
			{
				and: [
					{
						id: { in: [1, 2] },
					},
					{
						locale: {
							in: ['cs'],
						},
					},
				],
			},
			{
				locale: { in: ['cs'] },
			},
		],
	})
})

predicateInjectorTest('injects predicate to where', () => {
	const injector = new PredicatesInjector(
		schema,
		new PredicateFactory(permissions, new VariableInjector(schema, { localeVariable: ['cs'] })),
	)

	const result = injector.inject(schema.entities['PostLocale'], { title: { eq: 'abc' } })

	assert.equal(result, {
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

predicateInjectorTest.run()
