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
			index: { fields: ['title'] },
		},
	],
	sql: SQL`CREATE INDEX ON "article" ("title");`,
})


testMigrations('drop index', {
	originalSchema: def.createModel(SchemaWithIndex),
	updatedSchema: def.createModel(SchemaWithoutIndex),
	diff: [
		{
			modification: 'removeIndex',
			entityName: 'Article',
			fields: ['title'],
		},
	],
	sql: SQL`DROP INDEX "idx_article_title";`,
})
