import { describe, it } from 'bun:test'
import { ConditionOptimizer } from '../../../src/mapper/select/optimizer/ConditionOptimizer'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { WhereOptimizer } from '../../../src/mapper/select/optimizer/WhereOptimizer'
import { acceptFieldVisitor } from '@contember/schema-utils'
import { assert } from '../../src/assert'

namespace TestModel {
	export class Author {
		name = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'authors')
		articles = def.oneHasMany(Article, 'author')
	}

	export class Article {
		title = def.stringColumn()
		isPublic = def.boolColumn().notNull()
		image = def.manyHasOne(Image, 'articles')
		author = def.manyHasOne(Author, 'articles')
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


	const A = { name: { eq: 'A' } }
	const B = { name: { eq: 'B' } }
	const C = { name: { eq: 'C' } }
	const D = { name: { eq: 'D' } }
	const E = { name: { eq: 'E' } }

	it('minimize: A || (A && B) => A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				A,
				{ and: [A, B] },
			],
		}, model.entities.Author), A)
	})

	it('minimize: (A && B) || A => A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{ and: [A, B] },
				A,
			],
		}, model.entities.Author), A)
	})

	it('minimize: A && (A || B) => A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				A,
				{ or: [A, B] },
			],
		}, model.entities.Author), A)
	})

	it('minimize: (A || B) && A => A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				{ or: [A, B] },
				A,
			],
		}, model.entities.Author), A)
	})

	it('minimize: A && (!A || B) => A && B', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				A,
				{ or: [{ not: A }, B] },
			],
		}, model.entities.Author), { and: [A, B] })
	})

	it('minimize: A || (!A && B) => A || B', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				A,
				{ and: [{ not: A }, B] },
			],
		}, model.entities.Author), { or: [A, B] })
	})


	it('minimize: A || !A => 1', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				A,
				{ not: A },
			],
		}, model.entities.Author), { id: { always: true } })
	})

	it('minimize: A && !A => 0', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				A,
				{ not: A },
			],
		}, model.entities.Author), { id: { never: true } })
	})

	it('minimize: !A && !A => !A', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				{ not: A },
				{ not: A },
			],
		}, model.entities.Author), { not: A })
	})


	it('not minimize: (A && B) || (A && C)', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{ and: [A, B] },
				{ and: [A, C] },
			],
		}, model.entities.Author), {
			or: [
				{ and: [A, B] },
				{ and: [A, C] },
			],
		})
	})

	it('minimize: (A || B) && (A || B || C) => A || B', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				{
					or: [A, B],
				},
				{
					or: [A, B, C],
				},
			],
		}, model.entities.Author), { or: [A, B] })
	})

	it('not minimize: (A || B) && (A || C)', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				{
					or: [A, B],
				},
				{
					or: [A, C],
				},
			],
		}, model.entities.Author), { and: [{ or: [A, B] }, { or: [A, C] }] })
	})

	it('minimize: (A && B) || (A && B && C) => A && B', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{
					and: [A, B],
				},
				{
					and: [A, B, C],
				},
			],
		}, model.entities.Author), { and: [A, B] })
	})

	it('minimize: (A && B) || (A && B) || (A && B) => A && B', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{
					and: [A, B],
				},
				{
					and: [A, B],
				},
				{
					and: [A, B],
				},
			],
		}, model.entities.Author), { and: [A, B] })
	})

	it('minimize: (a && b) || (a && b && c) || (a && c) => (a && b) || (a && c)', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{
					and: [A, B],
				},
				{
					and: [A, B, C],
				},
				{
					and: [A, C],
				},
			],
		}, model.entities.Author), {
			or: [
				{
					and: [A, B],
				},
				{
					and: [A, C],
				},
			],
		})
	})

	it('minimize: (a && b) || (c && (d || (a && b && e))) => (a && b) || (c && d)', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			or: [
				{
					and: [A, B],
				},
				{
					and: [C, { or: [D, { and: [A, B, E] }] }],
				},
			],
		}, model.entities.Author), { or: [{ and: [A, B] }, { and: [C, D] }] })
	})

	it('minimize: (a || b) && (c || (d && (a || b || e))) => (A || B) && (C || D)', () => {
		assert.deepStrictEqual(whereOptimizer.optimize({
			and: [
				{
					or: [A, B],
				},
				{
					or: [C, { and: [D, { or: [A, B, E] }] }],
				},
			],
		}, model.entities.Author), { and: [{ or: [A, B] }, { or: [C, D] }] })
	})

	describe('remove id predicates', () => {

		it('remove ID predicate when traversing from a relation - always', () => {
			const relationPath = [acceptFieldVisitor(model, 'Image', 'authors', {
				visitColumn: () => {
					throw new Error()
				},
				visitRelation: context => context,
			})]
			assert.deepStrictEqual(whereOptimizer.optimize({
				image: { id: { isNull: false } },
			}, model.entities.Author, { relationPath }), {
				id: { always: true },
			})
		})


		it('remove ID predicate when traversing from a relation - never', () => {
			assert.deepStrictEqual(whereOptimizer.optimize({
				image: { id: { isNull: true } },
			}, model.entities.Author, { relationPath: [acceptFieldVisitor(model, 'Image', 'authors', {
				visitColumn: () => {
					throw new Error()
				},
				visitRelation: context => context,
			})] }), {
				id: { never: true },
			})
		})

		it('remove ID predicate when traversing in where', () => {
			assert.deepStrictEqual(whereOptimizer.optimize({
				authors: { image: { id: { isNull: false } } },
			}, model.entities.Image), {
				id: { always: true },
			})
		})

		it('do not remove ID predicate when traversing from a has-many relation', () => {
			const relationPath = [acceptFieldVisitor(model, 'Author', 'image', {
				visitColumn: () => {
					throw new Error()
				},
				visitRelation: context => context,
			})]
			assert.deepStrictEqual(whereOptimizer.optimize({
				authors: { id: { isNull: false } },
			}, model.entities.Image, { relationPath }), {
				authors: { id: { isNull: false } },
			})
		})

		it('do not remove ID predicate when traversing from a nested has-many relation', () => {
			const relationPath = [
				acceptFieldVisitor(model, 'Author', 'articles', {
					visitColumn: () => {
						throw new Error()
					},
					visitRelation: context => context,
				}),
				acceptFieldVisitor(model, 'Article', 'image', {
					visitColumn: () => {
						throw new Error()
					},
					visitRelation: context => context,
				}),
			]
			assert.deepStrictEqual(whereOptimizer.optimize({
				articles: { author: { id: { isNull: false } } },
			}, model.entities.Image, { relationPath }), {
				articles: { author: { id: { isNull: false } } },
			})
		})

		it('do not remove ID predicate when traversing in where over has-many relation', () => {
			assert.deepStrictEqual(whereOptimizer.optimize({
				image: { authors: { id: { isNull: false } } },
			}, model.entities.Author), {
				image: { authors: { id: { isNull: false } } },
			})
		})


		it('do not remove ID predicate when traversing in where over has-many relation - nested', () => {
			assert.deepStrictEqual(whereOptimizer.optimize({
				image: { authors: { image: { id: { isNull: false } } } },
			}, model.entities.Author), {
				image: { authors: { image: { id: { isNull: false } } } },
			})
		})
	})
})

