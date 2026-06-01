import { describe, it } from 'bun:test'
import { testApplyDiff, testMigrations } from '../../src/tests.js'
import { SQL } from '../../src/tags.js'
import { createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { createDatabaseMetadata } from '@contember/database'

namespace SchemaWithoutIndex {
	export class Article {
		title = def.stringColumn()
	}
}

// base with an extra column used as the INCLUDE / predicate target in covering & partial tests
namespace SchemaArticleBase {
	export class Article {
		title = def.stringColumn()
		content = def.stringColumn()
	}
}

namespace SchemaWithPartialIndex {
	@def.Index({ fields: ['title'], where: 'title IS NOT NULL' })
	export class Article {
		title = def.stringColumn()
		content = def.stringColumn()
	}
}

namespace SchemaWithCoveringIndex {
	@def.Index({ fields: ['title'], include: ['content'] })
	export class Article {
		title = def.stringColumn()
		content = def.stringColumn()
	}
}

namespace SchemaWithPartialCoveringIndex {
	@def.Index({ fields: ['title'], include: ['content'], where: 'title IS NOT NULL' })
	export class Article {
		title = def.stringColumn()
		content = def.stringColumn()
	}
}

namespace SchemaWithPartialIndexA {
	@def.Index({ fields: ['title'], where: "content = 'a'" })
	export class Article {
		title = def.stringColumn()
		content = def.stringColumn()
	}
}

namespace SchemaWithPartialIndexB {
	@def.Index({ fields: ['title'], where: "content = 'b'" })
	export class Article {
		title = def.stringColumn()
		content = def.stringColumn()
	}
}

namespace SchemaWithTwoPartialIndexes {
	@def.Index({ fields: ['title'], where: "content = 'a'" })
	@def.Index({ fields: ['title'], where: "content = 'b'" })
	export class Article {
		title = def.stringColumn()
		content = def.stringColumn()
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

describe('create index', () =>
	testMigrations({
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

describe('drop index', () =>
	testMigrations({
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

describe('create index with GIN method', () =>
	testMigrations({
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

describe('change index method from btree to gin', () =>
	testMigrations({
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

describe('change from regular index to method-specific index', () =>
	testMigrations({
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

describe('create partial index', () =>
	testMigrations({
		original: createSchema(SchemaArticleBase),
		updated: createSchema(SchemaWithPartialIndex),
		diff: [
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: { fields: ['title'], where: 'title IS NOT NULL' },
			},
		],
		sql: SQL`CREATE INDEX ON "article" ("title") WHERE (title IS NOT NULL);`,
	}))

describe('create covering index', () =>
	testMigrations({
		original: createSchema(SchemaArticleBase),
		updated: createSchema(SchemaWithCoveringIndex),
		diff: [
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: { fields: ['title'], include: ['content'] },
			},
		],
		sql: SQL`CREATE INDEX ON "article" ("title") INCLUDE ("content");`,
	}))

describe('create partial covering index', () =>
	testMigrations({
		original: createSchema(SchemaArticleBase),
		updated: createSchema(SchemaWithPartialCoveringIndex),
		diff: [
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: { fields: ['title'], include: ['content'], where: 'title IS NOT NULL' },
			},
		],
		sql: SQL`CREATE INDEX ON "article" ("title") INCLUDE ("content") WHERE (title IS NOT NULL);`,
	}))

describe('drop partial index', () =>
	testMigrations({
		original: createSchema(SchemaWithPartialIndex),
		updated: createSchema(SchemaArticleBase),
		diff: [
			{
				modification: 'removeIndex',
				entityName: 'Article',
				fields: ['title'],
				where: 'title IS NOT NULL',
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

describe('drop covering index', () =>
	// metadata reports both key and INCLUDE columns (pg_index.indkey lists both), so the DROP
	// matching must include the covering column too.
	testMigrations({
		original: createSchema(SchemaWithCoveringIndex),
		updated: createSchema(SchemaArticleBase),
		diff: [
			{
				modification: 'removeIndex',
				entityName: 'Article',
				fields: ['title'],
				include: ['content'],
			},
		],
		sql: SQL`DROP INDEX "idx_article_title_content";`,
		databaseMetadata: createDatabaseMetadata({
			foreignKeys: [],
			indexes: [{
				tableName: 'article',
				columnNames: ['title', 'content'],
				indexName: 'idx_article_title_content',
				unique: false,
			}],
			uniqueConstraints: [],
		}),
	}))

// Two partial indexes on the same columns differing only by WHERE must NOT be treated as the same
// index: changing the predicate produces a remove + create, never a no-op.
describe('change partial index predicate', () =>
	testMigrations({
		original: createSchema(SchemaWithPartialIndexA),
		updated: createSchema(SchemaWithPartialIndexB),
		diff: [
			{
				modification: 'removeIndex',
				entityName: 'Article',
				fields: ['title'],
				where: "content = 'a'",
			},
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: { fields: ['title'], where: "content = 'b'" },
			},
		],
		sql: SQL`DROP INDEX "idx_article_title";
CREATE INDEX ON "article" ("title") WHERE (content = 'b');`,
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

// Schema-level identity is predicate-aware: removing one of two partial indexes on identical columns
// must leave the other intact (the old columns-only matching removed both).
describe('remove one of two partial indexes on the same columns', () =>
	it('keeps the sibling index', () => {
		testApplyDiff(
			createSchema(SchemaWithTwoPartialIndexes),
			createSchema(SchemaWithPartialIndexA),
			[
				{
					modification: 'removeIndex',
					entityName: 'Article',
					fields: ['title'],
					where: "content = 'b'",
				},
			],
		)
	}))
