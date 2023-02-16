import { testMigrations } from '../../src/tests'
import { SchemaBuilder, SchemaDefinition as def } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { SQL } from '../../src/tags'


namespace SchemaWithoutOrderBy {
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaWithOrderBy {
	@def.OrderBy('title', Model.OrderDirection.asc)
	export class Article {
		title = def.stringColumn()
	}
}

testMigrations('update entity order by', {
	originalSchema: def.createModel(SchemaWithoutOrderBy),
	updatedSchema: def.createModel(SchemaWithOrderBy),
	diff: [
		{
			modification: 'updateEntityOrderBy',
			entityName: 'Article',
			orderBy: [{ path: ['title'], direction: 'asc' }],
		},
	],
	sql: SQL``,
})
