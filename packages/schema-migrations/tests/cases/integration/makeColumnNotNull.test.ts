import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('make column not null', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String).notNull()))
		.buildSchema(),
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'name',
			definition: {
				type: Model.ColumnType.String,
				columnType: 'text',
				nullable: false,
			},
		},
	],
	sql: SQL`ALTER TABLE "author"
		ALTER "name" SET NOT NULL;`,
})
