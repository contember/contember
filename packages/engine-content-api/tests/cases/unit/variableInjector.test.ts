import { VariableInjector } from '../../../src/acl/index.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { describe, it } from 'bun:test'
import { assert } from '../../src/assert.js'

describe('Variable injector', () => {
	it('injects variable', () => {
		const schema = new SchemaBuilder()
			.enum('locale', ['cs', 'en'])
			.entity('PostLocale', e =>
				e
					.column('locale', c => c.type(Model.ColumnType.Enum, { enumName: 'locale' }))
					.column('foo', c => c.type(Model.ColumnType.String))
					.column('public', c => c.type(Model.ColumnType.Bool))
					.manyHasOne('post', r => r.target('Post', e => e.manyHasOne('site', r => r.target('Site', e => e)))))
			.buildSchema()

		const ids = ['91528a5c-839b-4114-9952-d661914a607f', '1e2f3937-a0b1-4105-8aae-6da8ac9fc146']
		const injector = new VariableInjector(schema, {
			site: { in: ids },
			locale: { eq: 'cs' },
		})
		const result = injector.inject(schema.entities['PostLocale'], {
			or: [
				{
					public: { eq: true },
				},
				{
					and: [
						{
							post: {
								site: 'site',
							},
						},
						{
							locale: 'locale',
						},
						{
							foo: 'bar',
						},
					],
				},
			],
		})

		assert.deepStrictEqual(result, {
			or: [
				{
					public: { eq: true },
				},
				{
					and: [
						{
							post: {
								site: { id: { in: ids } },
							},
						},
						{
							locale: { eq: 'cs' },
						},
						{
							foo: { never: true },
						},
					],
				},
			],
		})
	})

	it('caches a shared predicate separately for each entity', () => {
		const schema = new SchemaBuilder()
			.entity('ColumnSource', entity => entity.column('value'))
			.entity('RelationSource', entity => entity.manyHasOne('value', relation => relation.target('Target', target => target)))
			.buildSchema()
		const injector = new VariableInjector(schema, { variable: { eq: 'value' } })
		const predicate: Acl.PredicateDefinition = { value: 'variable' }

		assert.deepStrictEqual(injector.inject(schema.entities.ColumnSource, predicate), { value: { eq: 'value' } })
		assert.deepStrictEqual(injector.inject(schema.entities.RelationSource, predicate), { value: { id: { eq: 'value' } } })
	})
})
