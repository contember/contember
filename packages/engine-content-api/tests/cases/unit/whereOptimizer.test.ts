import { describe, it, assert } from 'vitest'
import { ConditionOptimizer } from '../../../src/mapper/select/optimizer/ConditionOptimizer'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { WhereOptimizer } from '../../../src/mapper/select/optimizer/WhereOptimizer'
import { acceptFieldVisitor } from '@contember/schema-utils'

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


	const A = { authors: { isPublic: { eq: true } } }
	const B = { authors: { name: { eq: 'John' } } }
	const C = { authors: { name: { eq: 'Jack' } } }

	it('minimize: A || (A && B) => A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				A,
				{ and: [A, B] },
			],
		}, model.entities.Image), A)
	})

	it('minimize: (A && B) || A => A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{ and: [A, B] },
				A,
			],
		}, model.entities.Image), A)
	})

	it('minimize: A && (A || B) => A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				A,
				{ or: [A, B] },
			],
		}, model.entities.Image), A)
	})

	it('minimize: (A || B) && A => A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				{ or: [A, B] },
				A,
			],
		}, model.entities.Image), A)
	})

	it('minimize: A && (!A || B) => A && B', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				A,
				{ or: [{ not: A }, B] },
			],
		}, model.entities.Image), { and: [A, B] })
	})

	it('minimize: A || (!A && B) => A || B', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				A,
				{ and: [{ not: A }, B] },
			],
		}, model.entities.Image), { or: [A, B] })
	})


	it('minimize: A || !A => 1', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				A,
				{ not: A },
			],
		}, model.entities.Image), { id: { always: true } })
	})

	it('minimize: A && !A => 0', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				A,
				{ not: A },
			],
		}, model.entities.Image), { id: { never: true } })
	})

	it('minimize: !A && !A => !A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				{ not: A },
				{ not: A },
			],
		}, model.entities.Image), { not: A })
	})


	it('not minimize: (A && B) || (A && C)', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{ and: [A, B] },
				{ and: [A, C] },
			],
		}, model.entities.Image), {
			or: [
				{ and: [A, B] },
				{ and: [A, C] },
			],
		})
	})


	describe('remove id predicates', () => {

		it('remove ID predicate when traversing from a relation - always', () => {
			assert.deepStrictEqual(whereOptimizer.optimize({
				image: { id: { isNull: false } },
			}, model.entities.Author, [acceptFieldVisitor(model, 'Image', 'authors', {
				visitColumn: () => {
					throw new Error()
				},
				visitRelation: context => context,
			})]), {
				id: { always: true },
			})
		})


		it('remove ID predicate when traversing from a relation - never', () => {
			assert.deepStrictEqual(whereOptimizer.optimize({
				image: { id: { isNull: true } },
			}, model.entities.Author, [acceptFieldVisitor(model, 'Image', 'authors', {
				visitColumn: () => {
					throw new Error()
				},
				visitRelation: context => context,
			})]), {
				id: { never: true },
			})
		})

		it('remove ID predicate when traversing in where', () => {
			assert.deepStrictEqual(whereOptimizer.optimize({
				authors: { image: { id: { isNull: false } } },
			}, model.entities.Image, []), {
				id: { always: true },
			})
		})


		it('do not remove ID predicate when traversing in where over has-many relation', () => {
			assert.deepStrictEqual(whereOptimizer.optimize({
				image: { authors: { id: { isNull: false } } },
			}, model.entities.Author, []), {
				image: { authors: { id: { isNull: false } } },
			})
		})
	})


})

