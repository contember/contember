import { testMigrations } from '../../src/tests'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'

testMigrations('update column definition', {
	originalSchema: new SchemaBuilder()
		.entity('Author', e =>
			e.column('name', c => c.type(Model.ColumnType.String)).column('registeredAt', c => c.type(Model.ColumnType.Date)),
		)
		.buildSchema(),
	updatedSchema: new SchemaBuilder()
		.entity('Author', e =>
			e
				.column('name', c => c.type(Model.ColumnType.String))
				.column('registeredAt', c => c.type(Model.ColumnType.DateTime)),
		)
		.buildSchema(),
	diff: [
		{
			modification: 'updateColumnDefinition',
			entityName: 'Author',
			fieldName: 'registeredAt',
			definition: {
				type: Model.ColumnType.DateTime,
				columnType: 'timestamptz',
				nullable: true,
			},
		},
	],
	sql: SQL`ALTER TABLE "author"
		ALTER "registered_at" SET DATA TYPE timestamptz USING "registered_at"::timestamptz;`,
})
