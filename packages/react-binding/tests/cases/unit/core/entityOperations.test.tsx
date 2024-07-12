import { describe, expect, it } from 'vitest'
import { EntitySubTree, Field, HasOne } from '../../../../src'
import { createBinding } from '../../../lib/bindingFactory'
import { c, createSchema } from '@contember/schema-definition'
import { convertModelToAdminSchema } from '../../../lib/convertModelToAdminSchema'
import assert from 'assert'


namespace TrackChangesModel {
	export class Foo {
		fooField = c.stringColumn()
	}
}

describe('entity operations', () => {
	it('tracks unpersisted changes count', () => {
		const { treeStore } = createBinding({
			node: (
				<EntitySubTree entity="Foo(bar = 123)">
					<Field field={'fooField'} />
				</EntitySubTree>
			),
			schema: convertModelToAdminSchema(createSchema(TrackChangesModel).model),
		})

		const entity = Array.from(treeStore.subTreeStatesByRoot.get(undefined)!.values())[0]
		assert(entity.type === 'entityRealm')

		expect(entity.unpersistedChangesCount).eq(0)
		entity.getAccessor().getField('fooField').updateValue('bar')
		expect(entity.unpersistedChangesCount).eq(1)
		entity.getAccessor().getField('fooField').updateValue(null)
		expect(entity.unpersistedChangesCount).eq(0)
	})

	it('fails when relation not defined in static render', () => {
		const { treeStore, environment } = createBinding({
			node: (<>
				<EntitySubTree entity="Article(id = 'cfb8d0ae-c892-4047-acfb-a89adab2371d')" alias="article">
				</EntitySubTree>
				<EntitySubTree entity="Category(id = '89560cfa-f874-42b6-ace3-35a8ebcbba15')" alias="category">
				</EntitySubTree>
			</>),
			schema: convertModelToAdminSchema(createSchema(ModelWithRelation).model),
		})
		const article = treeStore.getSubTreeState('entity', undefined, 'article', environment)
		const category = treeStore.getSubTreeState('entity', undefined, 'category', environment)
		expect(() => {
			article.getAccessor().connectEntityAtField('category', category.getAccessor())
		}).toThrowError('Cannot connect at field \'category\' as it wasn\'t registered during static render.')
	})

	it('ok when relation defined in static render', () => {
		const { treeStore, environment } = createBinding({
			node: (<>
				<EntitySubTree entity="Article(id = 'cfb8d0ae-c892-4047-acfb-a89adab2371d')" alias="article">
					<HasOne field="category" />
				</EntitySubTree>
				<EntitySubTree entity="Category(id = '89560cfa-f874-42b6-ace3-35a8ebcbba15')" alias="category">
				</EntitySubTree>
			</>),
			schema: convertModelToAdminSchema(createSchema(ModelWithRelation).model),
		})
		const article = treeStore.getSubTreeState('entity', undefined, 'article', environment)
		const category = treeStore.getSubTreeState('entity', undefined, 'category', environment)
		article.getAccessor().connectEntityAtField('category', category.getAccessor())
	})
})



namespace ModelWithRelation {
	export class Category {
		articles = c.oneHasMany(Article, 'category')
	}

	export class Article {
		category = c.manyHasOne(Category, 'articles')
	}
}
