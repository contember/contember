import { Model } from '@contember/schema'
import { expect, test } from 'bun:test'
import { createSchema, c } from '../../../src'

namespace FieldMetadataModel {
	export class Article {
		oldTitle = c.stringColumn()
			.deprecated('This field will be removed in v2.0')

		content = c.stringColumn()
			.alias('body')
			.deprecated('This field will be removed in v2.0')

		publishedAt = c.dateTimeColumn()
			.deprecated('Use publicationDate instead')
			.alias('publishDate', 'releaseDate')
	}

	export class Comment {
		content = c.stringColumn()
		article = c.manyHasOne(Article).deprecated('Use parentArticle instead').alias('post')
		replies = c.oneHasMany(Comment, 'parentComment').deprecated('Use childComments instead').alias('responses')
		tags = c.manyHasMany(Tag).deprecated('Use labels instead').alias('categories')
		parentComment = c.oneHasOne(Comment).deprecated('Use parent instead').alias('replyTo')
	}

	export class Tag {
		name = c.stringColumn()

		comments = c.manyHasManyInverse(Comment, 'tags')
			.deprecated('Use associatedComments instead')
			.alias('commentList')
	}
}

test('deprecated column field metadata', () => {
	const schema = createSchema(FieldMetadataModel)
	const articleEntity = schema.model.entities.Article

	expect(articleEntity.fields.oldTitle).toMatchObject({
		name: 'oldTitle',
		type: Model.ColumnType.String,
		deprecationReason: 'This field will be removed in v2.0',
	})
})

test('articleEntity.fields.author', () => {
	const schema = createSchema(FieldMetadataModel)
	const articleEntity = schema.model.entities.Article

	// Check field with aliases
	expect(articleEntity.fields.content).toMatchObject({
		name: 'content',
		type: Model.ColumnType.String,
		nullable: true,
		aliases: ['body'],
	})

	// Check field with all metadata
	expect(articleEntity.fields.publishedAt).toMatchObject({
		name: 'publishedAt',
		type: Model.ColumnType.DateTime,
		deprecationReason: 'Use publicationDate instead',
		aliases: ['publishDate', 'releaseDate'],
	})
})

test('non-deprecated field should not have deprecated property', () => {
	const schema = createSchema(FieldMetadataModel)
	const commentEntity = schema.model.entities.Comment

	expect(commentEntity.fields.content).toMatchObject({
		name: 'content',
		type: Model.ColumnType.String,
	})
	expect(commentEntity.fields.content).not.toHaveProperty('deprecated')
	expect(commentEntity.fields.content).not.toHaveProperty('alias')
})

test('deprecated relation field metadata', () => {
	const schema = createSchema(FieldMetadataModel)
	const commentEntity = schema.model.entities.Comment

	// Check deprecated ManyHasOne relation
	expect(commentEntity.fields.article).toMatchObject({
		name: 'article',
		type: Model.RelationType.ManyHasOne,
		target: 'Article',
		nullable: true,
		deprecationReason: 'Use parentArticle instead',
		aliases: ['post'],
	})
})

test('deprecated OneHasMany relation metadata', () => {
	const schema = createSchema(FieldMetadataModel)
	const commentEntity = schema.model.entities.Comment

	// Check deprecated OneHasMany relation
	expect(commentEntity.fields.replies).toMatchObject({
		name: 'replies',
		type: Model.RelationType.OneHasMany,
		target: 'Comment',
		ownedBy: 'parentComment',
		deprecationReason: 'Use childComments instead',
		aliases: ['responses'],
	})
})

test('deprecated ManyHasMany relation metadata', () => {
	const schema = createSchema(FieldMetadataModel)
	const commentEntity = schema.model.entities.Comment

	// Check deprecated ManyHasMany relation
	expect(commentEntity.fields.tags).toMatchObject({
		name: 'tags',
		type: Model.RelationType.ManyHasMany,
		target: 'Tag',
		deprecationReason: 'Use labels instead',
		aliases: ['categories'],
	})
})

test('deprecated OneHasOne relation metadata', () => {
	const schema = createSchema(FieldMetadataModel)
	const commentEntity = schema.model.entities.Comment

	expect(commentEntity.fields.parentComment).toMatchObject({
		name: 'parentComment',
		type: Model.RelationType.OneHasOne,
		target: 'Comment',
		nullable: true,
		deprecationReason: 'Use parent instead',
		aliases: ['replyTo'],
	})
})

test('deprecated inverse relation metadata', () => {
	const schema = createSchema(FieldMetadataModel)
	const tagEntity = schema.model.entities.Tag

	// Check deprecated inverse relation
	expect(tagEntity.fields.comments).toMatchObject({
		name: 'comments',
		type: Model.RelationType.ManyHasMany,
		target: 'Comment',
		ownedBy: 'tags',
		deprecationReason: 'Use associatedComments instead',
		aliases: ['commentList'],
	})
})

test('field metadata builder methods', () => {
	const column = c.stringColumn()
		.deprecated('Old field')
		.alias('oldName', 'legacyName')

	expect(column.options).toMatchObject({
		type: Model.ColumnType.String,
		deprecationReason: 'Old field',
		aliases: ['oldName', 'legacyName'],
	})
})

test('relation metadata builder methods', () => {
	// Test relation builder methods
	const relation = c.manyHasOne(FieldMetadataModel.Article)
		.deprecated('Old relation')
		.alias('oldRelation')

	expect(relation.options).toMatchObject({
		target: FieldMetadataModel.Article,
		deprecationReason: 'Old relation',
		aliases: ['oldRelation'],
	})
})

test('empty alias array should not be included', () => {
	const column = c.stringColumn().alias()

	// Empty alias array should not be included in the created field
	expect(column.options.aliases).toEqual([])
})

test('chaining metadata methods', () => {
	// Test that methods can be chained in any order
	const column1 = c.stringColumn()
		.deprecated('Test')
		.alias('alias1')

	const column2 = c.stringColumn()
		.alias('alias2')
		.deprecated('Test')

	expect(column1.options.deprecationReason).toBe('Test')
	expect(column1.options.aliases).toEqual(['alias1'])

	expect(column2.options.deprecationReason).toBe('Test')
	expect(column2.options.aliases).toEqual(['alias2'])
})
