import * as validation from '../../../src/input-validation'
import 'mocha'
import { expect } from 'chai'
import { Model } from 'cms-common'
import ObjectNode from '../../../src/content-api/graphQlResolver/ObjectNode'
import FieldNode from '../../../src/content-api/graphQlResolver/FieldNode'
import { SchemaBuilder } from '../../../src'
import DependencyCollector from '../../../src/input-validation/DependencyCollector'
import QueryAstFactory from '../../../src/input-validation/QueryAstFactory'

describe('input validation', () => {
	it('evaluates rule', () => {
		const r = validation.rules
		const rule = r.conditional(
			r.on('books', r.filter(r.on('deleted', r.equals(false)), r.on('published', r.any(r.equals(true))))),
			r.on('published', r.equals(true))
		)
		console.log(JSON.stringify(rule, null, ' '))
		const author = {
			books: [
				{ published: true, deleted: true },
				{ published: false, deleted: false },
				{ published: true, deleted: false },
			],
			published: true,
		}

		const context = validation.createRootContext(author)

		expect(validation.evaluate(context, rule)).eq(true)
	})

	it('collects dependencies', () => {
		const r = validation.rules
		const validator = r.conditional(
			r.on('books', r.filter(r.on('deleted', r.equals(false)), r.on('published', r.any(r.equals(true))))),
			r.on('published', r.equals(true))
		)

		const collector = new DependencyCollector()

		expect(collector.collect(validator)).deep.eq([
			['books'],
			['books', 'deleted'],
			['books', 'published'],
			['published'],
		])
	})

	it('constructs query AST', () => {
		const schema = new SchemaBuilder()
			.entity('Book', e =>
				e
					.column('deleted', c => c.type(Model.ColumnType.Bool))
					.column('published', c => c.type(Model.ColumnType.Bool))
					.manyHasOne('category', r => r.target('Category'))
			)
			.entity('Category', e => e.column('name'))
			.entity('Author', e =>
				e
					.oneHasMany('books', r => r.target('Book').ownedBy('author'))
					.column('published', c => c.type(Model.ColumnType.Bool))
			)
			.buildSchema()
		const dependencies = [
			['books'],
			['books', 'deleted'],
			['books', 'published'],
			['books', 'category', 'name'],
			['published'],
		]

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
							new FieldNode('deleted', 'deleted', {}),
							new FieldNode('published', 'published', {}),
							new ObjectNode('category', 'category', [new FieldNode('name', 'name', {})], {}, {}, []),
						],
						{},
						{},
						[]
					),
					new FieldNode('published', 'published', {}),
				],
				{},
				{},
				[]
			)
		)
	})
})
