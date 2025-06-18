import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

describe('add manyHasOne alias', () => {
	const originalSchema = new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.manyHasOne('category', r => r.target('Category')),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema()

	const updatedSchema = new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.manyHasOne('category', r => r.target('Category').alias('c')),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema()

	return testMigrations({
		original: {
			model: originalSchema,
		},
		updated: {
			model: updatedSchema,
		},
		diff: [
			{
				modification: 'createRelationAliases',
				entityName: 'Post',
				fieldName: 'category',
				aliases: ['c'],
			},
		],
		sql: SQL``,
	})
})

// describe('remove manyHasOne alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('Post', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.manyHasOne('category', r => r.target('Category').alias('c')),
// 			)
// 			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('Post', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.manyHasOne('category', r => r.target('Category')),
// 			)
// 			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'Post',
// 			fieldName: 'category',
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('update manyHasOne alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('Post', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.manyHasOne('category', r => r.target('Category').alias('c')),
// 			)
// 			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('Post', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.manyHasOne('category', r => r.target('Category').alias('c', 'categoryAlias')),
// 			)
// 			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'Post',
// 			fieldName: 'category',
// 			aliases: ['c', 'categoryAlias'],
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('add oneHasMany alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('Author', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasMany('articles', r => r.target('Article').ownedBy('author')),
// 			)
// 			.entity('Article', entity =>
// 				entity.column('title', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('Author', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasMany('articles', r => r.target('Article').ownedBy('author').alias('a')),
// 			)
// 			.entity('Article', entity =>
// 				entity.column('title', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'Author',
// 			fieldName: 'articles',
// 			aliases: ['a'],
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('remove oneHasMany alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('Author', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasMany('articles', r => r.target('Article').ownedBy('author').alias('a')),
// 			)
// 			.entity('Article', entity =>
// 				entity.column('title', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('Author', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasMany('articles', r => r.target('Article').ownedBy('author')),
// 			)
// 			.entity('Article', entity =>
// 				entity.column('title', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'Author',
// 			fieldName: 'articles',
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('update oneHasMany alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('Author', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasMany('articles', r => r.target('Article').ownedBy('author').alias('a')),
// 			)
// 			.entity('Article', entity =>
// 				entity.column('title', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('Author', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasMany('articles', r => r.target('Article').ownedBy('author').alias('a', 'articles')),
// 			)
// 			.entity('Article', entity =>
// 				entity.column('title', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'Author',
// 			fieldName: 'articles',
// 			aliases: ['a', 'articles'],
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('add oneHasOne alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('User', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasOne('profile', r => r.target('Profile').inversedBy('user')),
// 			)
// 			.entity('Profile', entity =>
// 				entity.column('bio', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('User', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasOne('profile', r => r.target('Profile').inversedBy('user').alias('p')),
// 			)
// 			.entity('Profile', entity =>
// 				entity.column('bio', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'User',
// 			fieldName: 'profile',
// 			aliases: ['p'],
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('remove oneHasOne alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('User', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasOne('profile', r => r.target('Profile').inversedBy('user').alias('p')),
// 			)
// 			.entity('Profile', entity =>
// 				entity.column('bio', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('User', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasOne('profile', r => r.target('Profile').inversedBy('user')),
// 			)
// 			.entity('Profile', entity =>
// 				entity.column('bio', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'User',
// 			fieldName: 'profile',
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('update oneHasOne alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('User', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasOne('profile', r => r.target('Profile').inversedBy('user').alias('p')),
// 			)
// 			.entity('Profile', entity =>
// 				entity.column('bio', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('User', entity =>
// 				entity
// 					.column('name', c => c.type(Model.ColumnType.String))
// 					.oneHasOne('profile', r => r.target('Profile').inversedBy('user').alias('p', 'userProfile')),
// 			)
// 			.entity('Profile', entity =>
// 				entity.column('bio', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'User',
// 			fieldName: 'profile',
// 			aliases: ['p', 'userProfile'],
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('add manyHasMany alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('BlogPost', entity =>
// 				entity
// 					.column('title', c => c.type(Model.ColumnType.String))
// 					.manyHasMany('tags', r => r.target('Tag').inversedBy('blogPosts')),
// 			)
// 			.entity('Tag', entity =>
// 				entity.column('name', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('BlogPost', entity =>
// 				entity
// 					.column('title', c => c.type(Model.ColumnType.String))
// 					.manyHasMany('tags', r => r.target('Tag').inversedBy('blogPosts').alias('t')),
// 			)
// 			.entity('Tag', entity =>
// 				entity.column('name', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'BlogPost',
// 			fieldName: 'tags',
// 			aliases: ['t'],
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('remove manyHasMany alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('BlogPost', entity =>
// 				entity
// 					.column('title', c => c.type(Model.ColumnType.String))
// 					.manyHasMany('tags', r => r.target('Tag').inversedBy('blogPosts').alias('t')),
// 			)
// 			.entity('Tag', entity =>
// 				entity.column('name', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('BlogPost', entity =>
// 				entity
// 					.column('title', c => c.type(Model.ColumnType.String))
// 					.manyHasMany('tags', r => r.target('Tag').inversedBy('blogPosts')),
// 			)
// 			.entity('Tag', entity =>
// 				entity.column('name', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'BlogPost',
// 			fieldName: 'tags',
// 		},
// 	],
// 	sql: SQL``,
// }))

// describe('update manyHasMany alias', () => testMigrations({
// 	original: {
// 		model: new SchemaBuilder()
// 			.entity('BlogPost', entity =>
// 				entity
// 					.column('title', c => c.type(Model.ColumnType.String))
// 					.manyHasMany('tags', r => r.target('Tag').inversedBy('blogPosts').alias('t')),
// 			)
// 			.entity('Tag', entity =>
// 				entity.column('name', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	updated: {
// 		model: new SchemaBuilder()
// 			.entity('BlogPost', entity =>
// 				entity
// 					.column('title', c => c.type(Model.ColumnType.String))
// 					.manyHasMany('tags', r => r.target('Tag').inversedBy('blogPosts').alias('t', 'postTags')),
// 			)
// 			.entity('Tag', entity =>
// 				entity.column('name', c => c.type(Model.ColumnType.String)),
// 			)
// 			.buildSchema(),
// 	},
// 	diff: [
// 		{
// 			modification: 'updateRelationAliases',
// 			entityName: 'BlogPost',
// 			fieldName: 'tags',
// 			aliases: ['t', 'postTags'],
// 		},
// 	],
// 	sql: SQL``,
// }))
