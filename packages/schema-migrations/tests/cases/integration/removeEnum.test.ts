import { testMigrations } from '../../src/tests.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags.js'

testMigrations('remove enum', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e =>
			e
				.column('title', c => c.type(Model.ColumnType.String))
				.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' })),
		)
		.enum('postStatus', ['publish', 'draft'])
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e => e.column('title', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	diff: [
		{
			modification: 'removeField',
			entityName: 'Post',
			fieldName: 'status',
		},
		{
			modification: 'removeEnum',
			enumName: 'postStatus',
		},
	],
	sql: SQL`ALTER TABLE "post"
		DROP "status";
	DROP DOMAIN "postStatus";`,
})
