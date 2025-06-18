import { Model } from '@contember/schema'
import { getEntity } from '@contember/schema-utils'
import { describe, expect, it } from 'bun:test'
import { SchemaBuilder } from '../../../src'

describe('Alias Fields', () => {
	describe('SchemaBuilder alias field handling', () => {
		it('stores alias metadata in fields', () => {
			const model = new SchemaBuilder()
				.entity('Post', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.column('content', c => c
						.type(Model.ColumnType.String)
						.notNull()
						.alias('body', 'text'),
					),
				)
				.buildSchema()

			const entity = getEntity(model, 'Post')

			expect(entity.fields.content).toBeDefined()
			expect(entity.fields.content.aliases).toEqual(['body', 'text'])

			// Aliases should not create separate fields - they are metadata
			expect(entity.fields.body).toBeUndefined()
			expect(entity.fields.text).toBeUndefined()
		})

		it('does not create alias fields when field has no alias property', () => {
			const model = new SchemaBuilder()
				.entity('Post', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.column('heading', c => c.type(Model.ColumnType.String).notNull()),
				)
				.buildSchema()

			const entity = getEntity(model, 'Post')

			const fieldNames = Object.keys(entity.fields)
			expect(fieldNames.includes('headingAlias')).toBe(false)
			expect(fieldNames.includes('headingAlternative')).toBe(false)
		})

		it('handles field with both deprecated and alias properties', () => {
			const model = new SchemaBuilder()
				.entity('Post', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.column('oldTitle', c => c
						.type(Model.ColumnType.String)
						.notNull()
						.deprecated('Field is deprecated')
						.alias('legacyTitle'),
					),
				)
				.buildSchema()

			const entity = getEntity(model, 'Post')

			expect(entity.fields.oldTitle.deprecationReason).toBe('Field is deprecated')
			expect(entity.fields.oldTitle.aliases).toEqual(['legacyTitle'])

			// Aliases should not create separate fields - they are metadata
			expect(entity.fields.legacyTitle).toBeUndefined()
		})

		it('handles empty alias array', () => {
			const model = new SchemaBuilder()
				.entity('Post', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.column('description', c => c
						.type(Model.ColumnType.String)
						.notNull()
						.alias(),
					),
				)
				.buildSchema()

			const entity = getEntity(model, 'Post')

			expect(entity.fields.description).toBeDefined()
			expect(entity.fields.description.deprecationReason).toBeUndefined()

			const fieldNames = Object.keys(entity.fields)
			expect(fieldNames.filter(name => name.includes('description')).length).toBe(1)
		})

		it('stores alias metadata for many-to-one relations', () => {
			const model = new SchemaBuilder()
				.entity('Author', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.column('name', c => c.type(Model.ColumnType.String).notNull()),
				)
				.entity('Post', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.manyHasOne('author', r => r.target('Author').notNull().alias('writer', 'creator')),
				)
				.buildSchema()

			const entity = getEntity(model, 'Post')

			expect(entity.fields.author).toBeDefined()
			expect(entity.fields.author.aliases).toEqual(['writer', 'creator'])

			// Aliases should not create separate fields - they are metadata
			expect(entity.fields.writer).toBeUndefined()
			expect(entity.fields.creator).toBeUndefined()
		})

		it('stores alias metadata for one-to-many relations', () => {
			const model = new SchemaBuilder()
				.entity('Author', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.oneHasMany('posts', r => r.target('Post').ownedBy('author').alias('articles', 'writings')),
				)
				.entity('Post', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary()),
				)
				.buildSchema()

			const entity = getEntity(model, 'Author')

			expect(entity.fields.posts).toBeDefined()
			expect(entity.fields.posts.aliases).toEqual(['articles', 'writings'])

			// Aliases should not create separate fields - they are metadata
			expect(entity.fields.articles).toBeUndefined()
			expect(entity.fields.writings).toBeUndefined()
		})

		it('stores alias metadata for one-to-one relations', () => {
			const model = new SchemaBuilder()
				.entity('User', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.column('name', c => c.type(Model.ColumnType.String).notNull()),
				)
				.entity('Profile', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.oneHasOne('user', r => r.target('User').notNull().alias('owner', 'account')),
				)
				.buildSchema()

			const entity = getEntity(model, 'Profile')

			expect(entity.fields.user).toBeDefined()
			expect(entity.fields.user.aliases).toEqual(['owner', 'account'])

			// Aliases should not create separate fields - they are metadata
			expect(entity.fields.owner).toBeUndefined()
			expect(entity.fields.account).toBeUndefined()
		})

		it('stores alias metadata for many-to-many relations', () => {
			const model = new SchemaBuilder()
				.entity('Tag', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.column('name', c => c.type(Model.ColumnType.String).notNull()),
				)
				.entity('Article', e => e
					.column('id', c => c.type(Model.ColumnType.Uuid).primary())
					.manyHasMany('tags', r => r.target('Tag').inversedBy('articles').alias('labels', 'categories')),
				)
				.buildSchema()

			const entity = getEntity(model, 'Article')

			expect(entity.fields.tags).toBeDefined()
			expect(entity.fields.tags.aliases).toEqual(['labels', 'categories'])

			// Aliases should not create separate fields - they are metadata
			expect(entity.fields.labels).toBeUndefined()
			expect(entity.fields.categories).toBeUndefined()
		})
	})
})
