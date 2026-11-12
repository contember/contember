import { describe, expect, it, mock } from 'bun:test'
import { Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { getEntity } from '@contember/schema-utils'

describe('Deprecated Fields', () => {
	describe('SchemaBuilder deprecated field handling', () => {
		it('creates field with deprecationReason when field has deprecated property', () => {
			const model = new SchemaBuilder()
				.entity('Book', e =>
					e
						.column('heading', c =>
							c
								.type(Model.ColumnType.String)
								.deprecated('This field is deprecated. Use heading instead.')))
				.buildSchema()

			const entity = getEntity(model, 'Book')

			expect(entity.fields.heading).toBeDefined()
			expect(entity.fields.heading.deprecationReason).toBe('This field is deprecated. Use heading instead.')
		})

		it('specifies deprecation reason for fields', () => {
			const model = new SchemaBuilder()
				.entity('Book', e =>
					e
						.column('title', c => c.type(Model.ColumnType.String))
						.column('content', c => c.type(Model.ColumnType.String).deprecated('Use content instead')))
				.buildSchema()

			const entity = getEntity(model, 'Book')

			expect(entity.fields.title).toBeDefined()
			expect(entity.fields.content).toBeDefined()
			expect(entity.fields.content.deprecationReason).toBe('Use content instead')
		})

		it('handles deprecation for oneHasOne relation', () => {
			const model = new SchemaBuilder()
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.entity('Profile', e =>
					e
						.column('bio', c => c.type(Model.ColumnType.String))
						.oneHasOne('author', r => r.target('Author').deprecated('Use different relation')))
				.buildSchema()

			const entity = getEntity(model, 'Profile')
			expect(entity.fields.author).toBeDefined()
			expect(entity.fields.author.deprecationReason).toBe('Use different relation')
		})

		it('handles deprecation for oneHasMany relation', () => {
			const model = new SchemaBuilder()
				.entity('Book', e => e.column('title', c => c.type(Model.ColumnType.String)))
				.entity('Author', e =>
					e
						.column('name', c => c.type(Model.ColumnType.String))
						.oneHasMany('books', r => r.target('Book').deprecated('Use publications instead')))
				.buildSchema()

			const entity = getEntity(model, 'Author')
			expect(entity.fields.books).toBeDefined()
			expect(entity.fields.books.deprecationReason).toBe('Use publications instead')
		})

		it('handles deprecation for manyHasOne relation', () => {
			const model = new SchemaBuilder()
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.entity('Book', e =>
					e
						.column('title', c => c.type(Model.ColumnType.String))
						.manyHasOne('author', r => r.target('Author').deprecated('Use creator instead')))
				.buildSchema()

			const entity = getEntity(model, 'Book')
			expect(entity.fields.author).toBeDefined()
			expect(entity.fields.author.deprecationReason).toBe('Use creator instead')
		})

		it('handles deprecation for manyHasMany relation', () => {
			const model = new SchemaBuilder()
				.entity('Tag', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.entity('Book', e =>
					e
						.column('title', c => c.type(Model.ColumnType.String))
						.manyHasMany('tags', r => r.target('Tag').inversedBy('books').deprecated('Use categories instead')))
				.buildSchema()

			const entity = getEntity(model, 'Book')
			expect(entity.fields.tags).toBeDefined()
			expect(entity.fields.tags.deprecationReason).toBe('Use categories instead')
		})

		it('uses a default reason when none is given', () => {
			const model = new SchemaBuilder()
				.entity('Book', e => e.column('title', c => c.type(Model.ColumnType.String).deprecated()))
				.buildSchema()

			expect(getEntity(model, 'Book').fields.title.deprecationReason).toBe('Field is deprecated')
		})

		it('annotates only the declared side of a relation', () => {
			const model = new SchemaBuilder()
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.entity('Tag', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.entity('Profile', e => e.column('bio', c => c.type(Model.ColumnType.String)))
				.entity('Review', e => e.column('text', c => c.type(Model.ColumnType.String)))
				.entity('Book', e =>
					e
						.manyHasOne('author', r => r.target('Author').inversedBy('books').deprecated('old author').description('the author'))
						.manyHasMany('tags', r => r.target('Tag').inversedBy('books').deprecated('old tags').description('the tags'))
						.oneHasOne('profile', r => r.target('Profile').inversedBy('book').deprecated('old profile').description('the profile'))
						.oneHasMany('reviews', r => r.target('Review').ownedBy('book').deprecated('old reviews').description('the reviews')))
				.buildSchema()

			const book = getEntity(model, 'Book')
			expect(book.fields.author.deprecationReason).toBe('old author')
			expect(book.fields.tags.deprecationReason).toBe('old tags')
			expect(book.fields.profile.deprecationReason).toBe('old profile')
			expect(book.fields.reviews.deprecationReason).toBe('old reviews')
			expect(book.fields.reviews.description).toBe('the reviews')

			for (const [entity, field] of [['Author', 'books'], ['Tag', 'books'], ['Profile', 'book'], ['Review', 'book']]) {
				const inverse = getEntity(model, entity).fields[field]
				expect(inverse).toBeDefined()
				expect(inverse.deprecationReason).toBeUndefined()
				expect(inverse.description).toBeUndefined()
			}
		})
	})
})
