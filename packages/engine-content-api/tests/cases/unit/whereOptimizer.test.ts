import { describe, it, assert } from 'vitest'
import { ConditionOptimizer } from '../../../src/mapper/select/optimizer/ConditionOptimizer'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { WhereOptimizer } from '../../../src/mapper/select/optimizer/WhereOptimizer'

namespace TestModel {
	export class Author {
		name = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'authors')
	}

	export class Article {
		title = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'articles')
	}

	export class Image {
		url = def.stringColumn().notNull()

		articles = def.oneHasMany(Article, 'image')
		authors = def.oneHasMany(Author, 'image')
	}
}

describe('where optimized', () => {
	const conditionOptimizer = new ConditionOptimizer()
	const model = def.createModel(TestModel)
	const whereOptimizer = new WhereOptimizer(model, conditionOptimizer)


	it('removes unnecessary condition', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{
					authors: { isPublic: { eq: true } },
				},
				{
					articles: { isPublic: { always: true } },
				},
			],
		}, model.entities.Image), {
			id: { always: true },
		})
	})

	it('keep condition', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{
					authors: { isPublic: { eq: true } },
				},
			],
		}, model.entities.Image), {
			authors: { isPublic: { eq: true } },
		})
	})

	it('do not swap AND and a field', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			authors: {
				and: [
					{ isPublic: { eq: true } },
					{ name: { eq: 'bar' } },
				],
			},
		}, model.entities.Image), {
			authors: {
				and: [
					{ isPublic: { eq: true } },
					{ name: { eq: 'bar' } },
				],
			},
		})
	})

	it('keep never', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				{
					or: [
						{ url: { never: true } },
						{ url: { never: true } },
					],
				},
			],
		}, model.entities.Image), {
			id: { never: true },
		},
		)
	})
})
