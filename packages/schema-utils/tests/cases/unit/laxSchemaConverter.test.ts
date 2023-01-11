import { expect, test } from 'vitest'
import { LaxSchemaConverter } from '../../../src'

test('lax schema converter basic', () => {
	const converter = new LaxSchemaConverter(
		{
			entities: {
				Article: {
					fields: {
						title: { type: 'string', notNull: true },
						content: { type: 'json' },
						state: { type: 'enum', values: ['draft', 'published', 'archived'], enumName: 'ArticleState' },
					},
				},
			},
		},
	)
	expect(converter.convert()).toMatchSnapshot()
})


test('lax schema converter one-has-many', () => {
	const converter = new LaxSchemaConverter(
		{
			entities: {
				Article: {
					fields: {
						title: { type: 'string', notNull: true },
						category: { type: 'manyHasOne', targetEntity: 'Category', targetField: 'articles' },
					},
				},
				Category: {
					fields: {
						articles: { type: 'oneHasMany', targetEntity: 'Article', targetField: 'category' },
					},
				},
			},
		},
	)
	const schema1 = converter.convert()
	expect(schema1).toMatchSnapshot()
	const converter2 = new LaxSchemaConverter(
		{
			entities: {
				Article: {
					fields: {
						title: { type: 'string', notNull: true },
						category: { type: 'manyHasOne', targetEntity: 'Category', targetField: 'articles' },
					},
				},
				Category: {
					fields: {},
				},
			},
		},
	)
	expect(converter2.convert()).deep.eq(schema1)
})


test('lax schema converter many-has-many', () => {
	const converter = new LaxSchemaConverter(
		{
			entities: {
				Article: {
					fields: {
						title: { type: 'string', notNull: true },
						tags: { type: 'manyHasMany', targetEntity: 'Tag', targetField: 'articles' },
					},
				},
				Tag: {
					fields: {
						articles: { type: 'manyHasManyInverse', targetEntity: 'Article', targetField: 'tags' },
					},
				},
			},
		},
	)
	const schema1 = converter.convert()
	expect(schema1).toMatchSnapshot()
	const converter2 = new LaxSchemaConverter(
		{
			entities: {
				Article: {
					fields: {
						title: { type: 'string', notNull: true },
						tags: { type: 'manyHasMany', targetEntity: 'Tag', targetField: 'articles' },
					},
				},
				Tag: {
					fields: {},
				},
			},
		},
	)
	expect(converter2.convert()).deep.eq(schema1)
})


test('lax schema converter one-has-one', () => {
	const converter = new LaxSchemaConverter(
		{
			entities: {
				Article: {
					fields: {
						title: { type: 'string', notNull: true },
						content: { type: 'oneHasOne', targetEntity: 'Content', targetField: 'article' },
					},
				},
				Content: {
					fields: {
						article: { type: 'oneHasOneInverse', targetEntity: 'Article', targetField: 'content' },
					},
				},
			},
		},
	)
	const schema1 = converter.convert()
	expect(schema1).toMatchSnapshot()
	const converter2 = new LaxSchemaConverter(
		{
			entities: {
				Article: {
					fields: {
						title: { type: 'string', notNull: true },
						content: { type: 'oneHasOne', targetEntity: 'Content', targetField: 'article' },
					},
				},
				Content: {
					fields: {},
				},
			},
		},
	)
	expect(converter2.convert()).deep.eq(schema1)
})

