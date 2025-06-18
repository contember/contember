import { Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { describe } from 'bun:test'
import { SQL } from '../../src/tags'
import { testMigrations } from '../../src/tests'

describe('make manyHasOne relation deprecated', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.manyHasOne('category', r => r.target('Category')),
			)
			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.manyHasOne('category', r => r.target('Category').deprecated('Use newCategory instead')),
			)
			.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'makeRelationDeprecated',
			entityName: 'Post',
			fieldName: 'category',
			deprecationReason: 'Use newCategory instead',
		},
	],
	sql: SQL``,
}))

describe('make oneHasMany relation deprecated', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Author', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasMany('articles', r => r.target('Article').ownedBy('author')),
			)
			.entity('Article', entity =>
				entity.column('title', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Author', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasMany('articles', r => r.target('Article').ownedBy('author').deprecated('Use books instead')),
			)
			.entity('Article', entity =>
				entity.column('title', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
	},
	diff: [
		{
			modification: 'makeRelationDeprecated',
			entityName: 'Author',
			fieldName: 'articles',
			deprecationReason: 'Use books instead',
		},
	],
	sql: SQL``,
}))

describe('make oneHasOne relation deprecated', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('User', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasOne('profile', r => r.target('Profile').inversedBy('user')),
			)
			.entity('Profile', entity =>
				entity.column('bio', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('User', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasOne('profile', r => r.target('Profile').inversedBy('user').deprecated('Use userProfile instead')),
			)
			.entity('Profile', entity =>
				entity.column('bio', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
	},
	diff: [
		{
			modification: 'makeRelationDeprecated',
			entityName: 'User',
			fieldName: 'profile',
			deprecationReason: 'Use userProfile instead',
		},
		{
			modification: 'makeRelationDeprecated',
			entityName: 'Profile',
			fieldName: 'user',
			deprecationReason: 'Use userProfile instead',
		},
	],
	sql: SQL``,
}))

describe('make manyHasMany relation deprecated', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('BlogPost', entity =>
				entity
					.column('title', c => c.type(Model.ColumnType.String))
					.manyHasMany('tags', r => r.target('Tag').inversedBy('blogPosts')),
			)
			.entity('Tag', entity =>
				entity.column('name', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('BlogPost', entity =>
				entity
					.column('title', c => c.type(Model.ColumnType.String))
					.manyHasMany('tags', r => r.target('Tag').inversedBy('blogPosts').deprecated('Use categories instead')),
			)
			.entity('Tag', entity =>
				entity.column('name', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
	},
	diff: [
		{
			modification: 'makeRelationDeprecated',
			entityName: 'BlogPost',
			fieldName: 'tags',
			deprecationReason: 'Use categories instead',
		},
	],
	sql: SQL``,
}))

describe('remove deprecation from relation', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Order', entity =>
				entity
					.column('total', c => c.type(Model.ColumnType.String))
					.manyHasOne('customer', r => r.target('Customer').deprecated('Use client instead')),
			)
			.entity('Customer', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Order', entity =>
				entity
					.column('total', c => c.type(Model.ColumnType.String))
					.manyHasOne('customer', r => r.target('Customer')),
			)
			.entity('Customer', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	diff: [
		{
			modification: 'makeRelationNotDeprecated',
			entityName: 'Order',
			fieldName: 'customer',
		},
	],
	sql: SQL``,
}))
