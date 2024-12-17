import { expect, test, describe } from 'bun:test'
import { conditionSchema } from '../../../src/type-schema'
import { Model } from '@contember/schema'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { whereSchema } from '../../../src/type-schema/where'

namespace MyModel {
	export class Article {
		title = def.stringColumn()
		category = def.manyHasOne(Category)
		tags = def.manyHasMany(Tag)
	}

	export class Category {
		name = def.stringColumn()
	}

	export class Tag {
		name = def.stringColumn()
	}
}

const schema = createSchema(MyModel).model

describe('where schema', () => {
	test('simple scalar where', () => {
		const where = {
			title: { eq: 'foo' },
		}
		expect(whereSchema({ schema, entity: schema.entities.Article })(where)).toStrictEqual(where)
	})

	test('where with and / or /not', () => {
		const where = {
			and: [
				{
					or: [
						{ not: { title: { eq: 'bar' } } },
					],
				},
			],
		}
		expect(whereSchema({ schema, entity: schema.entities.Article })(where)).toStrictEqual(where)
	})


	test('where with relation', () => {
		const where = {
			tags: { name: { eq: 'xx' } },
		}
		expect(whereSchema({ schema, entity: schema.entities.Article })(where)).toStrictEqual(where)
	})

	test('undefined field', () => {
		const where = {
			name: { eq: 'foo' },
		}
		expect(() => whereSchema({
			schema,
			entity: schema.entities.Article,
		})(where)).toThrow('value at root: extra property name found')
	})


	test('undefined field in relation', () => {
		const where = {
			tags: {
				caption: { eq: 'foo' },

			},
		}
		expect(() => whereSchema({
			schema,
			entity: schema.entities.Article,
		})(where)).toThrow('value at path /tags: extra property caption found')
	})


	test('invalid condition', () => {
		const where = {
			title: { xx: 'foo' },
		}
		expect(() => whereSchema({
			schema,
			entity: schema.entities.Article,
		})(where)).toThrow('value at path /title: extra property xx found')
	})

})
