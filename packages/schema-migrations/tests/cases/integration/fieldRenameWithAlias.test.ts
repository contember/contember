import { Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'
import { describe } from 'bun:test'
import { SQL } from '../../src/tags'
import { testMigrations } from '../../src/tests'

describe('rename field with alias preservation', () => testMigrations({
	original: {
		model: new SchemaBuilder()
			.entity('Author', e => e.column('firstName', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
	},
	updated: {
		model: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String).alias('firstName')))
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
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'name',
			definition: {
				nullable: true,
				aliases: ['firstName'],
				type: 'String',
				columnType: 'text',
			},
		},
	],
	sql: SQL`ALTER TABLE "author" RENAME "first_name" TO "name";`,
	noDiff: false, // We want the differ to automatically generate this
}))

describe('rename relation with alias preservation', () => {
	const original = new SchemaBuilder()
		.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author').inversedBy('posts')))
		.entity('Author', e => e.column('name'))
		.buildSchema()

	const updated = new SchemaBuilder()
		.entity('Post', e =>
			e.column('title').manyHasOne('createdBy', r =>
				r.target('Author').inversedBy('posts').alias('author').joiningColumn('author_id'),
			),
		)
		.entity('Author', e => e.column('name'))
		.buildSchema()

	return testMigrations({
		original: { model: original },
		updated: { model: updated },
		diff: [
			{
				modification: 'updateFieldName',
				entityName: 'Post',
				fieldName: 'author',
				newFieldName: 'createdBy',
			},
			{
				modification: 'createRelationAliases',
				entityName: 'Post',
				fieldName: 'createdBy',
				aliases: ['author'],
			},
		],
		sql: SQL``,
		noDiff: false, // We want the differ to automatically generate this
	})
})
