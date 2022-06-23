import { testMigrations } from '../../src/tests.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'

testMigrations('update relation ondelete to cascade', {
	originalSchema: new SchemaBuilder()
		.entity('Post', entity =>
			entity.column('name', c => c.type(Model.ColumnType.String)).manyHasOne('category', r => r.target('Category')),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.manyHasOne('category', r => r.target('Category').onDelete(Model.OnDelete.cascade)),
		)
		.entity('Category', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'updateRelationOnDelete',
			entityName: 'Post',
			fieldName: 'category',
			onDelete: Model.OnDelete.cascade,
		},
	],
	sql: SQL``,
})
