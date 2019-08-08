import * as validation from '../../../src/content-api/input-validation'
import 'mocha'
import { expect } from 'chai'
import { Model } from 'cms-common'
import ObjectNode from '../../../src/content-api/graphQlResolver/ObjectNode'
import FieldNode from '../../../src/content-api/graphQlResolver/FieldNode'
import { SchemaBuilder } from '../../../src'
import DependencyCollector from '../../../src/content-api/input-validation/DependencyCollector'
import QueryAstFactory from '../../../src/content-api/input-validation/QueryAstFactory'
import DependencyMerger from '../../../src/content-api/input-validation/DependencyMerger'
import { evaluateValidation } from '../../../src/content-api/input-validation/ValidationEvaluation'
import ValidationContext from '../../../src/content-api/input-validation/ValidationContext'

describe('input validation', () => {
	it('evaluates rule', () => {
		const r = validation.rules
		const rule = r.conditional(
			r.on('books', r.filter(r.on('deleted', r.equals(false)), r.on('published', r.any(r.equals(true))))),
			r.on('published', r.equals(true)),
		)

		const author = {
			books: [
				{ published: true, deleted: true },
				{ published: false, deleted: false },
				{ published: true, deleted: false },
			],
			published: true,
		}

		const context = ValidationContext.createRootContext(author)

		expect(evaluateValidation(context, rule)).eq(true)
	})

	it('evaluates collection length rule', () => {
		const rule = validation.rules.on('tags', validation.rules.minLength(2))

		const author = {
			tags: [{ value: 'abc' }, { value: 'xyz' }],
		}

		const context = ValidationContext.createRootContext(author)

		expect(evaluateValidation(context, rule)).eq(true)
	})

	it('collects dependencies', () => {
		const r = validation.rules
		const validator = r.conditional(
			r.on('books', r.filter(r.on('deleted', r.equals(false)), r.on('published', r.any(r.equals(true))))),
			r.on('published', r.equals(true)),
		)

		const collector = new DependencyCollector()

		expect(collector.collect(validator)).deep.eq({
			books: {
				deleted: {},
				published: {},
			},
			published: {},
		})
	})

	it('merges dependencies', () => {
		const aDeps = {
			a1: {
				b1: {
					c1: {},
					c2: {},
				},
			},
			a2: {},
		}
		const bDeps = {
			a1: {
				b1: {
					c1: { d1: {} },
					c3: {},
				},
			},
			a3: {},
		}
		const result = DependencyMerger.merge(aDeps, bDeps)
		expect(result).deep.eq({
			a1: {
				b1: {
					c1: {
						d1: {},
					},
					c2: {},
					c3: {},
				},
			},
			a2: {},
			a3: {},
		})
	})

	it('constructs query AST', () => {
		const schema = new SchemaBuilder()
			.entity('Book', e =>
				e
					.column('deleted', c => c.type(Model.ColumnType.Bool))
					.column('published', c => c.type(Model.ColumnType.Bool))
					.manyHasOne('category', r => r.target('Category')),
			)
			.entity('Category', e => e.column('name'))
			.entity('Author', e =>
				e
					.oneHasMany('books', r => r.target('Book').ownedBy('author'))
					.column('published', c => c.type(Model.ColumnType.Bool)),
			)
			.buildSchema()
		const dependencies: DependencyCollector.Dependencies = {
			books: {
				deleted: {},
				published: {},
				category: {
					name: {},
				},
			},
			published: {},
		}

		const astFactory = new QueryAstFactory(schema)
		const result = astFactory.create('Author', dependencies)

		expect(result).deep.equal(
			new ObjectNode(
				'Author',
				'Author',
				[
					new ObjectNode(
						'books',
						'books',
						[
							new FieldNode('id', 'id', {}),
							new FieldNode('deleted', 'deleted', {}),
							new FieldNode('published', 'published', {}),
							new ObjectNode(
								'category',
								'category',
								[new FieldNode('id', 'id', {}), new FieldNode('name', 'name', {})],
								{},
								{},
								[],
							),
						],
						{},
						{},
						[],
					),
					new FieldNode('published', 'published', {}),
				],
				{},
				{},
				[],
			),
		)
	})
})
