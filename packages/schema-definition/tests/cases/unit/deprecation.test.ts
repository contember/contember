import { describe, expect, test } from 'bun:test'
import { c, createSchema } from '../../../src'
import { DEFAULT_ENTITY_DEPRECATION_REASON, DEFAULT_FIELD_DEPRECATION_REASON } from '@contember/schema-utils'

namespace DeprecationModel {
	@c.Deprecated()
	export class Entity1 {
		title = c.stringColumn()
	}

	@c.Deprecated('Entity2 is deprecated.')
	export class Entity2 {
		title = c.stringColumn()
	}

	export class Entity3 {
		title = c.stringColumn().deprecated()
	}

	export class Entity4 {
		order = c.intColumn()
		title = c.stringColumn().deprecated('Title is deprecated')
	}

	export class Parent {
		title = c.stringColumn()
		children = c.oneHasMany(Child, 'parent').deprecated()
		optionalChild = c.oneHasOne(OptionalChild, 'parent').deprecated('This relation is deprecated')
		inverseSibling = c.oneHasOneInverse(InverseSibling, 'sibling').deprecated()
		standaloneSibling = c.oneHasOne(StandaloneSibling).deprecated('Standalone relation is deprecated')
	}

	export class StandaloneSibling {
		title = c.stringColumn()
	}

	export class Child {
		title = c.stringColumn()
		parent = c.manyHasOne(Parent, 'children').deprecated('Parent reference is deprecated')
	}

	export class OptionalChild {
		title = c.stringColumn()
		parent = c.oneHasOneInverse(Parent, 'optionalChild').deprecated()
	}

	export class InverseSibling {
		title = c.stringColumn()
		sibling = c.oneHasOne(Parent, 'inverseSibling').deprecated('Sibling relation is deprecated')
	}

	export class Tag {
		name = c.stringColumn()
		articles = c.manyHasMany(Article, 'tags').deprecated()
		standaloneArticles = c.manyHasMany(StandaloneArticle).deprecated('Standalone articles are deprecated')
	}

	export class StandaloneArticle {
		title = c.stringColumn()
	}

	export class Article {
		title = c.stringColumn()
		tags = c.manyHasManyInverse(Tag, 'articles').deprecated('Tags are deprecated')
	}
}

describe('deprecated', () => {

	test('entity deprecation without message', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Entity1.deprecationReason).toBe(DEFAULT_ENTITY_DEPRECATION_REASON)
	})

	test('entity deprecation with message', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Entity2.deprecationReason).toBe('Entity2 is deprecated.')
	})

	test('field deprecation without message', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Entity3.fields.title.deprecationReason).toBe(DEFAULT_FIELD_DEPRECATION_REASON)
	})

	test('field deprecation with message', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Entity4.fields.title.deprecationReason).toBe('Title is deprecated')
		expect(schema.model.entities.Entity4.fields.order.deprecationReason).toBeUndefined()
	})

	test('oneHasMany relation deprecation', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Parent.fields.children.deprecationReason).toBe(DEFAULT_FIELD_DEPRECATION_REASON)
	})

	test('manyHasOne relation deprecation', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Child.fields.parent.deprecationReason).toBe('Parent reference is deprecated')
	})

	test('manyHasMany relation deprecation', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Tag.fields.articles.deprecationReason).toBe(DEFAULT_FIELD_DEPRECATION_REASON)
	})

	test('standalone manyHasMany relation deprecation', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Tag.fields.standaloneArticles.deprecationReason).toBe('Standalone articles are deprecated')
	})

	test('manyHasManyInverse relation deprecation', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Article.fields.tags.deprecationReason).toBe('Tags are deprecated')
	})

	test('oneHasOne relation deprecation', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Parent.fields.optionalChild.deprecationReason).toBe('This relation is deprecated')
	})

	test('standalone oneHasOne relation deprecation', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Parent.fields.standaloneSibling.deprecationReason).toBe('Standalone relation is deprecated')
	})

	test('oneHasOneInverse relation deprecation', () => {
		const schema = createSchema(DeprecationModel)

		expect(schema.model.entities.Parent.fields.inverseSibling.deprecationReason).toBe(DEFAULT_FIELD_DEPRECATION_REASON)
		expect(schema.model.entities.OptionalChild.fields.parent.deprecationReason).toBe(DEFAULT_FIELD_DEPRECATION_REASON)
		expect(schema.model.entities.InverseSibling.fields.sibling.deprecationReason).toBe('Sibling relation is deprecated')
	})
})
