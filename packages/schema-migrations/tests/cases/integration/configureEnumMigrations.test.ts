import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'

namespace ViewEnumOriginalSchema {
	export class A {
		name = def.enumColumn(def.createEnum('a').disableMigrations())
	}

	export class B {
		name = def.enumColumn(def.createEnum('a'))
	}
}

namespace ViewEnumUpdatedSchema {
	export class A {
		name = def.enumColumn(def.createEnum('a', 'b'))
	}

	export class B {
		name = def.enumColumn(def.createEnum('a', 'b').disableMigrations())
	}
}


testMigrations('configure migrations strategy', {
	originalSchema: def.createModel(ViewEnumOriginalSchema),
	updatedSchema: def.createModel(ViewEnumUpdatedSchema),
	diff: [
		{
			modification: 'configureEnumDatabaseMigrations',
			enumName: 'AName',
			migrations: {
				enabled: true,
			},
		},
		{
			modification: 'configureEnumDatabaseMigrations',
			enumName: 'BName',
			migrations: {
				enabled: false,
			},
		},
		{
			modification: 'updateEnum',
			enumName: 'AName',
			values: [
				'a',
				'b',
			],
		},
		{
			modification: 'updateEnum',
			enumName: 'BName',
			values: [
				'a',
				'b',
			],
		},

	],
	sql: SQL`ALTER DOMAIN "AName" DROP CONSTRAINT aname_check; ALTER DOMAIN "AName" ADD CONSTRAINT aname_check CHECK (VALUE IN('a','b'));`,
})
