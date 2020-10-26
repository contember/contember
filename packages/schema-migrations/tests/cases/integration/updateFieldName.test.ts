import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('rename a field', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.column('firstName', c => c.type(Model.ColumnType.String).columnName('name')))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
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
})

testMigrations('rename a field with a constraint', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.column('slug', c => c.type(Model.ColumnType.String).unique()))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Author', e => e.column('identifier', c => c.type(Model.ColumnType.String).columnName('slug').unique()))
		.buildSchema(),
	diff: [
		{
			modification: 'updateFieldName',
			entityName: 'Author',
			fieldName: 'slug',
			newFieldName: 'identifier',
		},
	],
	sql: SQL`ALTER TABLE "author"
			RENAME CONSTRAINT "unique_Author_slug_a645b0" TO "unique_Author_identifier_4eb9f2";`,
	noDiff: true,
})

testMigrations('rename a relation', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasOne('user', r => r.target('Author').inversedBy('posts')))
		.entity('Author', e => e.column('name'))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e =>
			e.column('title').manyHasOne('author', r => r.target('Author').inversedBy('posts').joiningColumn('user_id')),
		)
		.entity('Author', e => e.column('name'))
		.buildSchema(),
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
})

testMigrations('rename relation with acl', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasOne('user', r => r.target('Author').inversedBy('posts')))
		.entity('Comment', e => e.column('content').manyHasOne('post', r => r.target('Post')))
		.entity('Author', e => e.column('name'))
		.buildSchema(),
	originalAcl: {
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
	updatedSchema: new SchemaBuilder()
		.entity('Post', e =>
			e.column('title').manyHasOne('author', r => r.target('Author').inversedBy('posts').joiningColumn('user_id')),
		)
		.entity('Comment', e => e.column('content').manyHasOne('post', r => r.target('Post')))
		.entity('Author', e => e.column('name'))
		.buildSchema(),
	updatedAcl: {
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
})
