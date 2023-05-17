import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('rename entity without renaming a table', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.tableName('user').column('name', c => c.type(Model.ColumnType.String)))
		.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author')))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('User', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('User')))
		.buildSchema(),
	diff: [
		{
			modification: 'updateEntityName',
			entityName: 'Author',
			newEntityName: 'User',
		},
	],
	sql: SQL``,
	noDiff: true,
})

testMigrations('rename entity and table', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('User', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'updateEntityName',
			entityName: 'Author',
			newEntityName: 'User',
			tableName: 'user',
		},
	],
	sql: SQL`ALTER TABLE "author"
		RENAME TO "user";`,
	noDiff: true,
})


testMigrations('rename entity with one-has-one (constraint)', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.oneHasOne('content', r => r.target('Content')))
		.entity('Content', e => e.column('foo'))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('User', e => e.tableName('author').oneHasOne('content', r => r.target('Content')))
		.entity('Content', e => e.column('foo'))
		.buildSchema(),
	diff: [
		{
			modification: 'updateEntityName',
			entityName: 'Author',
			newEntityName: 'User',
		},
	],
	sql: SQL``,
	noDiff: true,
})

testMigrations('rename table with acl', {
	originalSchema: new SchemaBuilder()
		.entity('Site', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	originalAcl: {
		roles: {
			admin: {
				variables: {},
				stages: '*',
				entities: {
					Site: {
						predicates: {},
						operations: {
							read: {
								id: true,
							},
						},
					},
				},
			},
		},
	},
	updatedSchema: new SchemaBuilder()
		.entity('Website', entity => entity.column('name', c => c.type(Model.ColumnType.String)).tableName('site'))
		.buildSchema(),
	updatedAcl: {
		roles: {
			admin: {
				variables: {},
				stages: '*',
				entities: {
					Website: {
						predicates: {},
						operations: {
							read: {
								id: true,
							},
						},
					},
				},
			},
		},
	},
	diff: [
		{
			modification: 'updateEntityName',
			entityName: 'Site',
			newEntityName: 'Website',
		},
	],
	sql: SQL``,
	noDiff: true,
})
