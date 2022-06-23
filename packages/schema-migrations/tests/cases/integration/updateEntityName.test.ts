import { testMigrations } from '../../src/tests.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'

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

testMigrations('rename entity with a constraint', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.column('slug', c => c.type(Model.ColumnType.String).unique()))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('User', e => e.tableName('author').column('slug', c => c.type(Model.ColumnType.String).unique()))
		.buildSchema(),
	diff: [
		{
			modification: 'updateEntityName',
			entityName: 'Author',
			newEntityName: 'User',
		},
	],
	sql: SQL`ALTER TABLE "author"
			RENAME CONSTRAINT "unique_Author_slug_a645b0" TO "unique_User_slug_d61dea";`,
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
