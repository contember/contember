import { testMigrations } from '../../src/tests.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'

testMigrations('disable orphan removal', {
	originalSchema: new SchemaBuilder()
		.entity('Post', entity =>
			entity
				.column('name', c => c.type(Model.ColumnType.String))
				.oneHasOne('content', r => r.target('Content').removeOrphan()),
		)
		.entity('Content', e => e.column('text', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', entity =>
			entity.column('name', c => c.type(Model.ColumnType.String)).oneHasOne('content', r => r.target('Content')),
		)
		.entity('Content', e => e.column('text', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'disableOrphanRemoval',
			entityName: 'Post',
			fieldName: 'content',
		},
	],
	sql: SQL``,
})
