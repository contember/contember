import { describe } from 'bun:test'
import { testMigrations } from '../../src/tests'
import { SQL } from '../../src/tags'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createDatabaseMetadata } from '@contember/database'

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

namespace SchemaWithGinIndex {
	@def.Index({ fields: ['title'], method: 'gin' })
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaWithGistIndex {
	@def.Index({ fields: ['title'], method: 'gist' })
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaWithBtreeIndex {
	@def.Index({ fields: ['title'], method: 'btree' })
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaWithHashIndex {
	@def.Index({ fields: ['title'], method: 'hash' })
	export class Article {
		title = def.stringColumn()
	}
}


describe('create index', () => testMigrations({
	original: createSchema(SchemaWithoutIndex),
	updated: createSchema(SchemaWithIndex),
	diff: [
		{
			modification: 'createIndex',
			entityName: 'Article',
			index: { fields: ['title'] },
		},
	],
	sql: SQL`CREATE INDEX ON "article" ("title");`,
}))


describe('drop index', () => testMigrations({
	original: createSchema(SchemaWithIndex),
	updated: createSchema(SchemaWithoutIndex),
	diff: [
		{
			modification: 'removeIndex',
			entityName: 'Article',
			fields: ['title'],
		},
	],
	sql: SQL`DROP INDEX "idx_article_title";`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [{
			tableName: 'article',
			columnNames: ['title'],
			indexName: 'idx_article_title',
			unique: false,
		}],
		uniqueConstraints: [],
	}),
}))


describe('create index with GIN method', () => testMigrations({
	original: createSchema(SchemaWithoutIndex),
	updated: createSchema(SchemaWithGinIndex),
	diff: [
		{
			modification: 'createIndex',
			entityName: 'Article',
			index: { fields: ['title'], method: 'gin' },
		},
	],
	sql: SQL`CREATE INDEX ON "article" USING gin ("title");`,
}))

describe('change index method from btree to gin', () => testMigrations({
	original: createSchema(SchemaWithBtreeIndex),
	updated: createSchema(SchemaWithGinIndex),
	diff: [
		{
			modification: 'removeIndex',
			entityName: 'Article',
			fields: ['title'],
		},
		{
			modification: 'createIndex',
			entityName: 'Article',
			index: { fields: ['title'], method: 'gin' },
		},
	],
	sql: SQL`DROP INDEX "idx_article_title";
CREATE INDEX ON "article" USING gin ("title");`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [{
			tableName: 'article',
			columnNames: ['title'],
			indexName: 'idx_article_title',
			unique: false,
		}],
		uniqueConstraints: [],
	}),
}))

describe('change from regular index to method-specific index', () => testMigrations({
	original: createSchema(SchemaWithIndex),
	updated: createSchema(SchemaWithHashIndex),
	diff: [
		{
			modification: 'removeIndex',
			entityName: 'Article',
			fields: ['title'],
		},
		{
			modification: 'createIndex',
			entityName: 'Article',
			index: { fields: ['title'], method: 'hash' },
		},
	],
	sql: SQL`DROP INDEX "idx_article_title";
CREATE INDEX ON "article" USING hash ("title");`,
	databaseMetadata: createDatabaseMetadata({
		foreignKeys: [],
		indexes: [{
			tableName: 'article',
			columnNames: ['title'],
			indexName: 'idx_article_title',
			unique: false,
		}],
		uniqueConstraints: [],
	}),
}))
