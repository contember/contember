import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('TODO', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e =>
			e
				.column('title', c => c.type(Model.ColumnType.String))
				.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' })),
		)
		.enum('postStatus', ['publish', 'draft', 'auto-draft'])
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e =>
			e
				.column('title', c => c.type(Model.ColumnType.String))
				.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' })),
		)
		.enum('postStatus', ['publish', 'draft', 'auto-draft', "SQL', 'injection"])
		.buildSchema(),
	diff: [
		{
			modification: 'updateEnum',
			enumName: 'postStatus',
			values: ['publish', 'draft', 'auto-draft', "SQL', 'injection"],
		},
	],
	sql: SQL`ALTER DOMAIN "postStatus" DROP CONSTRAINT postStatus_check;
	ALTER DOMAIN "postStatus" ADD CONSTRAINT postStatus_check CHECK (VALUE IN('publish','draft','auto-draft','SQL'', ''injection'));`,
})
