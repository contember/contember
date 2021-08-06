import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { Model } from '@contember/schema'

namespace ViewEntityOriginalSchema {
	@def.View("SELECT null as id, 'John' AS name")
	export class Author {
		name = def.stringColumn()
	}
}

namespace ViewEntityUpdatedSchema {
	@def.View("SELECT null as id, 'John' AS name, 'root@localhost' as email")
	export class Author {
		name = def.stringColumn()
		email = def.stringColumn()
	}
}
testMigrations('update a view', {
	originalSchema: def.createModel(ViewEntityOriginalSchema),
	updatedSchema: def.createModel(ViewEntityUpdatedSchema),
	diff: [
		{
			modification: 'updateView',
			entityName: 'Author',
			view: {
				sql: "SELECT null as id, 'John' AS name, 'root@localhost' as email",
			},
		},
		{
			modification: 'createColumn',
			entityName: 'Author',
			field: {
				columnName: 'email',
				name: 'email',
				nullable: true,
				type: Model.ColumnType.String,
				columnType: 'text',
			},
		},
	],
	sql: SQL`CREATE OR REPLACE VIEW "author" AS SELECT null as id, 'John' AS name, 'root@localhost' as email;`,
})
