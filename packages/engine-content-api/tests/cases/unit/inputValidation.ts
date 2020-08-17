import { Model } from '@contember/schema'
import { InputValidation as validation, SchemaBuilder } from '@contember/schema-definition'
import 'jasmine'
import DependencyCollector from '../../../src/input-validation/dependencies/DependencyCollector'
import QueryAstFactory from '../../../src/input-validation/QueryAstFactory'
import DependencyMerger from '../../../src/input-validation/dependencies/DependencyMerger'
import { evaluateValidation } from '../../../src/input-validation/ValidationEvaluation'
import ValidationContext from '../../../src/input-validation/ValidationContext'
import { FieldNode, ObjectNode } from '../../../src/inputProcessing'

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

		expect(evaluateValidation(context, rule)).toBe(true)
	})

	it('evaluates collection length rule', () => {
		const rule = validation.rules.on('tags', validation.rules.minLength(2))

		const author = {
			tags: [{ value: 'abc' }, { value: 'xyz' }],
		}

		const context = ValidationContext.createRootContext(author)

		expect(evaluateValidation(context, rule)).toBe(true)
	})

	it('collects dependencies', () => {
		const r = validation.rules
		const validator = r.conditional(
			r.on('books', r.filter(r.on('deleted', r.equals(false)), r.on('published', r.any(r.equals(true))))),
			r.on('published', r.equals(true)),
		)

		expect(DependencyCollector.collect(validator)).toEqual({
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
		expect(result).toEqual({
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

		expect(result).toEqual(
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

	describe('trinary logic', () => {
		it('trinary "and" results in a null', () => {
			const rule = validation.rules.and(
				validation.rules.on('email', validation.rules.pattern(/.+@.+/)),
				validation.rules.on('name', validation.rules.pattern(/.+/)),
			)

			const author = {
				name: 'john',
				email: null,
			}

			const context = ValidationContext.createRootContext(author)

			expect(evaluateValidation(context, rule)).toBe(null)
		})

		it('trinary "and" results in a false', () => {
			const rule = validation.rules.and(
				validation.rules.on('email', validation.rules.pattern(/.+@.+/)),
				validation.rules.on('name', validation.rules.pattern(/.+/)),
			)

			const author = {
				name: null,
				email: 'abcd',
			}

			const context = ValidationContext.createRootContext(author)

			expect(evaluateValidation(context, rule)).toBe(false)
		})
		it('trinary "and" results in a true', () => {
			const rule = validation.rules.and(
				validation.rules.on('email', validation.rules.pattern(/.+@.+/)),
				validation.rules.on('name', validation.rules.pattern(/.+/)),
			)

			const author = {
				name: 'johh',
				email: 'abcd@foo',
			}

			const context = ValidationContext.createRootContext(author)

			expect(evaluateValidation(context, rule)).toBe(true)
		})
	})
})
