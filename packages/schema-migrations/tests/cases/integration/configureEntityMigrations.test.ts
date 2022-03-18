import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'

namespace ViewEntityOriginalSchema {
	@def.DisableMigrations()
	export class A {
		name = def.stringColumn()
	}

	export class B {
		name = def.stringColumn()
	}
}

namespace ViewEntityUpdatedSchema {
	export class A {
		name = def.stringColumn()
		subtitle = def.stringColumn()
	}

	@def.DisableMigrations()
	export class B {
		name = def.stringColumn()
		subtitle = def.stringColumn()
	}
}


testMigrations('configure migrations strategy', {
	originalSchema: def.createModel(ViewEntityOriginalSchema),
	updatedSchema: def.createModel(ViewEntityUpdatedSchema),
	diff: [
		{
			modification: 'configureEntityDatabaseMigrations',
			entityName: 'A',
			migrations: {
				enabled: true,
			},
		},
		{
			modification: 'configureEntityDatabaseMigrations',
			entityName: 'B',
			migrations: {
				enabled: false,
			},
		},
		{
			modification: 'createColumn',
			entityName: 'A',
			field: {
				name: 'subtitle',
				columnName: 'subtitle',
				nullable: true,
				type: 'String',
				columnType: 'text',
			},
		},
		{
			modification: 'createColumn',
			entityName: 'B',
			field: {
				name: 'subtitle',
				columnName: 'subtitle',
				nullable: true,
				type: 'String',
				columnType: 'text',
			},
		},
	],
	sql: SQL`ALTER TABLE "a" ADD "subtitle" text;`,
})
