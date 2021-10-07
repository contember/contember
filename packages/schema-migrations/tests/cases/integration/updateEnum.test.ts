import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('update enum', {
	originalSchema: new SchemaBuilder()
		.entity('Post', e =>
			e
				.column('title', c => c.type(Model.ColumnType.String))
				.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' })),
		)
		.enum('postStatus', ['publish', 'draft', 'autodraft'])
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Post', e =>
			e
				.column('title', c => c.type(Model.ColumnType.String))
				.column('status', c => c.type(Model.ColumnType.Enum, { enumName: 'postStatus' })),
		)
		.enum('postStatus', ['publish', 'draft'])
		.buildSchema(),
	diff: [
		{
			modification: 'updateEnum',
			enumName: 'postStatus',
			values: ['publish', 'draft'],
		},
	],
	sql: SQL`ALTER DOMAIN "postStatus" DROP CONSTRAINT poststatus_check;
	ALTER DOMAIN "postStatus" ADD CONSTRAINT poststatus_check CHECK (VALUE IN('publish','draft'));`,
})
