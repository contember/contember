import 'mocha'
import { expect } from 'chai'
import VariableInjector from '../../../src/acl/VariableInjector'
import SchemaBuilder from '../../../src/content-schema/builder/SchemaBuilder'
import { Acl, Model } from 'cms-common'
import PredicatesInjector from '../../../src/acl/PredicatesInjector'
import ObjectNode from '../../../src/content-api/graphQlResolver/ObjectNode'
import FieldNode from '../../../src/content-api/graphQlResolver/FieldNode'
import PredicateFactory from "../../../src/acl/PredicateFactory";

describe('predicates injector', () => {
	const schema = new SchemaBuilder()
		.enum('locale', ['cs', 'en'])
		.entity('Post', entityBuilder => entityBuilder.oneHasMany('locales', c => c.target('PostLocale')))
		.entity('PostLocale', entity =>
			entity
				.column('title', column => column.type(Model.ColumnType.String))
				.column('content', column => column.type(Model.ColumnType.String))
				.column('locale', column => column.type(Model.ColumnType.Enum, { enumName: 'locale' }))
		)
		.buildSchema()

	const permissions: Acl.Permissions = {
		Post: {
			predicates: {},
			operations: {
				read: {
					id: true,
					locales: true
				}
			}
		},
		PostLocale: {
			predicates: {
				localePredicate: {
					locale: 'localeVariable'
				}
			},
			operations: {
				read: {
					id: true,
					title: 'localePredicate',
					content: 'localePredicate'
				}
			}
		}
	}

	it('injects predicate', () => {
		const injector = new PredicatesInjector(schema, new PredicateFactory(permissions, new VariableInjector({localeVariable: ['cs']})))
		const obj: ObjectNode = new ObjectNode(
			'PostLocale',
			'PostLocale',
			[new FieldNode('id', 'id'), new FieldNode('title', 'title')],
			{}
		)
		const result = injector.inject(schema.entities['PostLocale'], obj)

		expect(result.args.where).deep.eq({
			and: [
				{
					and: [
						{
							locale: {in: ['cs']}
						}
					]
				}
			]
		})
	})

	it('injects predicate and ignore duplicates', () => {
		const injector = new PredicatesInjector(schema, new PredicateFactory(permissions, new VariableInjector({localeVariable: ['cs']})))
		const obj: ObjectNode = new ObjectNode(
			'PostLocale',
			'PostLocale',
			[new FieldNode('id', 'id'), new FieldNode('title', 'title'), new FieldNode('content', 'content')],
			{}
		)
		const result = injector.inject(schema.entities['PostLocale'], obj)

		expect(result.args.where).deep.eq({
			and: [
				{
					and: [
						{
							locale: { in: ['cs'] }
						}
					]
				}
			]
		})
	})

	it('merges predicate with explicit where', () => {
		const injector = new PredicatesInjector(schema, new PredicateFactory(permissions, new VariableInjector({localeVariable: ['cs']})))
		const obj: ObjectNode = new ObjectNode(
			'PostLocale',
			'PostLocale',
			[new FieldNode('id', 'id'), new FieldNode('title', 'title')],
			{ where: { id: { in: [1, 2] } } }
		)
		const result = injector.inject(schema.entities['PostLocale'], obj)

		expect(result.args.where).deep.eq({
			and: [
				{
					and: [
						{
							id: { in: [1, 2] }
						}
					]
				},
				{
					and: [
						{
							locale: { in: ['cs'] }
						}
					]
				}
			]
		})
	})

	it('does not injects predicate when not requesting restricted', () => {
		const injector = new PredicatesInjector(schema, new PredicateFactory(permissions, new VariableInjector({localeVariable: ['cs']})))
		const obj: ObjectNode = new ObjectNode('PostLocale', 'PostLocale', [new FieldNode('id', 'id')], {})
		const result = injector.inject(schema.entities['PostLocale'], obj)

		expect(result.args.where).deep.eq({ and: [] })
	})

	it('injects predicate to nested field', () => {
		const injector = new PredicatesInjector(schema, new PredicateFactory(permissions, new VariableInjector({localeVariable: ['cs']})))
		const obj: ObjectNode = new ObjectNode(
			'Post',
			'Post',
			[new FieldNode('id', 'id'), new ObjectNode('locales', 'locales', [new FieldNode('title', 'title')], {})],
			{}
		)
		const result = injector.inject(schema.entities['Post'], obj)

		expect(result.args.where).deep.eq({
			and: []
		})

		expect(
			(result.fields.find((it: ObjectNode | FieldNode) => it.name === 'locales') as ObjectNode).args.where
		).deep.eq({
			and: [
				{
					and: [
						{
							locale: { in: ['cs'] }
						}
					]
				}
			]
		})
	})

	it('injects predicate to where', () => {
		const injector = new PredicatesInjector(schema, new PredicateFactory(permissions, new VariableInjector({localeVariable: ['cs']})))
		const obj: ObjectNode = new ObjectNode('PostLocale', 'PostLocale', [new FieldNode('id', 'id')], {
			where: { title: { eq: 'abc' } }
		})
		const result = injector.inject(schema.entities['PostLocale'], obj)

		expect(result.args.where).deep.eq({
			and: [
				{
					and: [
						{
							title: { eq: 'abc' }
						},
						{
							and: [
								{
									locale: { in: ['cs'] }
								}
							]
						}
					]
				}
			]
		})
	})

	it('injects predicate to nested where', () => {
		const injector = new PredicatesInjector(schema, new PredicateFactory(permissions, new VariableInjector({localeVariable: ['cs']})))
		const obj: ObjectNode = new ObjectNode(
			'Post',
			'Post',
			[
				new FieldNode('id', 'id'),
				new ObjectNode('locales', 'locales', [new FieldNode('id', 'id')], { where: { title: { eq: 'abc' } } })
			],
			{}
		)
		const result = injector.inject(schema.entities['Post'], obj)

		expect(result.args.where).deep.eq({
			and: []
		})

		expect(
			(result.fields.find((it: ObjectNode | FieldNode) => it.name === 'locales') as ObjectNode).args.where
		).deep.eq({
			and: [
				{
					and: [
						{
							title: { eq: 'abc' }
						},
						{
							and: [
								{
									locale: { in: ['cs'] }
								}
							]
						}
					]
				}
			]
		})
	})
})
