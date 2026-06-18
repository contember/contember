import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests.js'
import { createSchema, SchemaBuilder, SchemaDefinition as def } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'

namespace IndexColumnOptionsRenameOriginal {
	@def.Index({ fields: [{ field: 'rank', order: 'desc' }] })
	export class Article {
		rank = def.intColumn()
		title = def.stringColumn()
	}
}

namespace IndexColumnOptionsRenameUpdated {
	@def.Index({ fields: [{ field: 'score', order: 'desc' }] })
	export class Article {
		// keep the DB column name so this is a pure field rename (no column-rename SQL)
		score = def.intColumn().columnName('rank')
		title = def.stringColumn()
	}
}

describe('rename a field', () =>
	testMigrations({
		original: {
			model: new SchemaBuilder()
				.entity('Author', e => e.column('firstName', c => c.type(Model.ColumnType.String).columnName('name')))
				.buildSchema(),
		},
		updated: {
			model: new SchemaBuilder()
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
		},
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'Author',
				fieldName: 'firstName',
				newFieldName: 'name',
			},
		],
		sql: SQL``,
		noDiff: true,
	}))

describe('rename a field with column', () =>
	testMigrations({
		original: {
			model: new SchemaBuilder()
				.entity('Author', e => e.column('firstName', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
		},
		updated: {
			model: new SchemaBuilder()
				.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
				.buildSchema(),
		},
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'Author',
				fieldName: 'firstName',
				newFieldName: 'name',
				columnName: 'name',
			},
		],
		sql: SQL`ALTER TABLE "author" RENAME "first_name" TO "name";`,
		noDiff: true,
	}))

describe('rename a field with one-has-one', () =>
	testMigrations({
		original: {
			model: new SchemaBuilder()
				.entity('Author', e => e.oneHasOne('content', r => r.target('Content')))
				.entity('Content', e => e.column('foo'))
				.buildSchema(),
		},
		updated: {
			model: new SchemaBuilder()
				.entity('Author', e => e.oneHasOne('description', r => r.target('Content').joiningColumn('content_id')))
				.entity('Content', e => e.column('foo'))
				.buildSchema(),
		},
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'Author',
				fieldName: 'content',
				newFieldName: 'description',
			},
		],
		sql: SQL``,
		noDiff: true,
	}))

describe('rename a relation', () =>
	testMigrations({
		original: {
			model: new SchemaBuilder()
				.entity('Post', e => e.column('title').manyHasOne('user', r => r.target('Author').inversedBy('posts')))
				.entity('Author', e => e.column('name'))
				.buildSchema(),
		},
		updated: {
			model: new SchemaBuilder()
				.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author').inversedBy('posts').joiningColumn('user_id')))
				.entity('Author', e => e.column('name'))
				.buildSchema(),
		},
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'Post',
				fieldName: 'user',
				newFieldName: 'author',
			},
		],
		sql: SQL``,
		noDiff: true,
	}))

describe('rename a relation with joining column', () =>
	testMigrations({
		original: {
			model: new SchemaBuilder()
				.entity('Post', e => e.column('title').manyHasOne('user', r => r.target('Author').inversedBy('posts')))
				.entity('Author', e => e.column('name'))
				.buildSchema(),
		},
		updated: {
			model: new SchemaBuilder()
				.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author').inversedBy('posts')))
				.entity('Author', e => e.column('name'))
				.buildSchema(),
		},
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'Post',
				fieldName: 'user',
				newFieldName: 'author',
				columnName: 'author_id',
			},
		],
		sql: SQL`ALTER TABLE "post" RENAME "user_id" TO "author_id";`,
		noDiff: true,
	}))

describe('rename relation with acl', () =>
	testMigrations({
		original: {
			model: new SchemaBuilder()
				.entity('Post', e => e.column('title').manyHasOne('user', r => r.target('Author').inversedBy('posts')))
				.entity('Comment', e => e.column('content').manyHasOne('post', r => r.target('Post')))
				.entity('Author', e => e.column('name'))
				.buildSchema(),
			acl: {
				roles: {
					admin: {
						variables: {
							authorId: {
								type: Acl.VariableType.entity,
								entityName: 'Author',
							},
						},
						stages: '*',
						entities: {
							Post: {
								predicates: {
									author: { user: { id: 'authorId' } },
								},
								operations: {
									read: {
										title: 'author',
									},
								},
							},
							Comment: {
								predicates: {
									postAuthor: { post: { user: { id: 'authorId' } } },
								},
								operations: {
									read: {
										content: 'postAuthor',
									},
								},
							},
						},
					},
				},
			},
		},
		updated: {
			model: new SchemaBuilder()
				.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author').inversedBy('posts').joiningColumn('user_id')))
				.entity('Comment', e => e.column('content').manyHasOne('post', r => r.target('Post')))
				.entity('Author', e => e.column('name'))
				.buildSchema(),
			acl: {
				roles: {
					admin: {
						variables: {
							authorId: {
								type: Acl.VariableType.entity,
								entityName: 'Author',
							},
						},
						stages: '*',
						entities: {
							Post: {
								predicates: {
									author: { author: { id: 'authorId' } },
								},
								operations: {
									read: {
										title: 'author',
									},
								},
							},
							Comment: {
								predicates: {
									postAuthor: { post: { author: { id: 'authorId' } } },
								},
								operations: {
									read: {
										content: 'postAuthor',
									},
								},
							},
						},
					},
				},
			},
		},
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'Post',
				fieldName: 'user',
				newFieldName: 'author',
			},
		],
		sql: SQL``,
		noDiff: true,
	}))

// Renaming a field that carries per-column index options must move the columnOptions entry to the new
// name (it is keyed by field name) — otherwise the options are lost and the schema fails validation.
describe('rename a field carrying per-column index options', () =>
	testMigrations({
		original: { model: createSchema(IndexColumnOptionsRenameOriginal).model },
		updated: { model: createSchema(IndexColumnOptionsRenameUpdated).model },
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'Article',
				fieldName: 'rank',
				newFieldName: 'score',
			},
		],
		sql: SQL``,
		noDiff: true,
	}))
