import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'
import { SchemaDefinition as def } from '@contember/schema-definition'

namespace SchemaWithoutIndex {
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaWithIndex {
	@def.Index('title')
	export class Article {
		title = def.stringColumn()
	}
}


testMigrations('create index', {
	originalSchema: def.createModel(SchemaWithoutIndex),
	updatedSchema: def.createModel(SchemaWithIndex),
	diff: [
		{
			modification: 'createIndex',
			entityName: 'Article',
			index: { name: 'idx_Article_title_2dc66a', fields: ['title'] },
		},
	],
	sql: SQL`CREATE INDEX "idx_Article_title_2dc66a" ON "article" ("title");`,
})


testMigrations('drop index', {
	originalSchema: def.createModel(SchemaWithIndex),
	updatedSchema: def.createModel(SchemaWithoutIndex),
	diff: [
		{
			modification: 'removeIndex',
			entityName: 'Article',
			indexName: 'idx_Article_title_2dc66a',
		},
	],
	sql: SQL`DROP INDEX "idx_Article_title_2dc66a";`,
})
