import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { createSchema, SchemaBuilder, SchemaDefinition as def } from '@contember/schema-definition'
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

describe('update entity add order by', () => testMigrations({
	original: createSchema(SchemaWithoutOrderBy),
	updated: createSchema(SchemaWithOrderBy),
	diff: [
		{
			modification: 'updateEntityOrderBy',
			entityName: 'Article',
			orderBy: [{ path: ['title'], direction: 'asc' }],
		},
	],
	sql: SQL``,
}))

describe('update entity remove order by', () => testMigrations({
	original: createSchema(SchemaWithOrderBy),
	updated: createSchema(SchemaWithoutOrderBy),
	diff: [
		{
			modification: 'updateEntityOrderBy',
			entityName: 'Article',
		},
	],
	sql: SQL``,
}))
