import { describe, expect, it } from 'bun:test'
import { testApplyDiff, testGenerateSql, testMigrations } from '../../src/tests.js'
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

namespace SchemaWithSortOrderIndex {
	@def.Index({ fields: [{ field: 'title', order: 'desc', nulls: 'last' }] })
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaWithPerColumnOpClassIndex {
	@def.Index({ fields: [{ field: 'title', opClass: 'text_pattern_ops' }] })
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaWithPlainAndSortOrderIndex {
	@def.Index('title')
	@def.Index({ fields: [{ field: 'title', order: 'desc' }] })
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaWithDescIndex {
	@def.Index({ fields: [{ field: 'title', order: 'desc' }] })
	export class Article {
		title = def.stringColumn()
	}
}

namespace SchemaMultiColumnBase {
	export class Article {
		category = def.stringColumn()
		publishedAt = def.dateTimeColumn()
		title = def.stringColumn()
	}
}

namespace SchemaWithMultiColumnOptionsIndex {
	@def.Index({ fields: ['category', { field: 'publishedAt', order: 'desc', nulls: 'last' }, { field: 'title', opClass: 'text_pattern_ops' }] })
	export class Article {
		category = def.stringColumn()
		publishedAt = def.dateTimeColumn()
		title = def.stringColumn()
	}
}

namespace SchemaWithOpClassPrecedenceIndex {
	@def.Index({ fields: ['title', { field: 'content', opClass: 'text_pattern_ops' }], opClass: 'varchar_pattern_ops' })
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

// The physical DROP matches by columns only (the predicate is not in the DB metadata). Two partial
// indexes on the same columns therefore both match — emitting a DROP for each would silently take out
// the sibling the schema still expects. The handler must fail loudly instead of dropping both.
describe('drop one of two same-column partial indexes', () =>
	it('throws rather than dropping both physical indexes', () => {
		expect(() =>
			testGenerateSql(
				createSchema(SchemaWithTwoPartialIndexes),
				[
					{
						modification: 'removeIndex',
						entityName: 'Article',
						fields: ['title'],
						where: "content = 'b'",
					},
				],
				'',
				createDatabaseMetadata({
					foreignKeys: [],
					indexes: [
						{ tableName: 'article', columnNames: ['title'], indexName: 'idx_article_title_a', unique: false },
						{ tableName: 'article', columnNames: ['title'], indexName: 'idx_article_title_b', unique: false },
					],
					uniqueConstraints: [],
				}),
			)
		).toThrow(/unambiguously drop index/)
	}))

describe('create index with sort order', () =>
	testMigrations({
		original: createSchema(SchemaWithoutIndex),
		updated: createSchema(SchemaWithSortOrderIndex),
		diff: [
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: { fields: ['title'], columnOptions: { title: { order: 'desc', nulls: 'last' } } },
			},
		],
		sql: SQL`CREATE INDEX ON "article" ("title" DESC NULLS LAST);`,
	}))

describe('create index with per-column operator class', () =>
	testMigrations({
		original: createSchema(SchemaWithoutIndex),
		updated: createSchema(SchemaWithPerColumnOpClassIndex),
		diff: [
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: { fields: ['title'], columnOptions: { title: { opClass: 'text_pattern_ops' } } },
			},
		],
		sql: SQL`CREATE INDEX ON "article" ("title" text_pattern_ops);`,
	}))

// Schema-level identity is per-column-option-aware: two indexes on the same column differing only by
// sort order must not be conflated — removing one must leave the other intact.
describe('remove one of two indexes on the same column differing only by sort order', () =>
	it('keeps the sibling index', () => {
		testApplyDiff(
			createSchema(SchemaWithPlainAndSortOrderIndex),
			createSchema(SchemaWithIndex),
			[
				{
					modification: 'removeIndex',
					entityName: 'Article',
					fields: ['title'],
					columnOptions: { title: { order: 'desc' } },
				},
			],
		)
	}))

// Changing column options on an existing index must recreate it (remove + create), never a no-op.
describe('change index column options recreates the index', () =>
	testMigrations({
		original: createSchema(SchemaWithIndex),
		updated: createSchema(SchemaWithDescIndex),
		diff: [
			{
				modification: 'removeIndex',
				entityName: 'Article',
				fields: ['title'],
			},
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: { fields: ['title'], columnOptions: { title: { order: 'desc' } } },
			},
		],
		sql: SQL`DROP INDEX "idx_article_title";
CREATE INDEX ON "article" ("title" DESC);`,
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

// Multi-column index mixing plain / order+nulls / per-column opClass — locks the clause ordering
// (column [opclass] [ASC|DESC] [NULLS …]) and the field→column-name alignment across positions.
describe('create multi-column index with mixed per-column options', () =>
	testMigrations({
		original: createSchema(SchemaMultiColumnBase),
		updated: createSchema(SchemaWithMultiColumnOptionsIndex),
		diff: [
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: {
					fields: ['category', 'publishedAt', 'title'],
					columnOptions: { publishedAt: { order: 'desc', nulls: 'last' }, title: { opClass: 'text_pattern_ops' } },
				},
			},
		],
		sql: SQL`CREATE INDEX ON "article" ("category", "published_at" DESC NULLS LAST, "title" text_pattern_ops);`,
	}))

// Per-column opClass overrides the index-level opClass; columns without an override inherit the global one.
describe('create index with per-column opClass overriding the index-level opClass', () =>
	testMigrations({
		original: createSchema(SchemaArticleBase),
		updated: createSchema(SchemaWithOpClassPrecedenceIndex),
		diff: [
			{
				modification: 'createIndex',
				entityName: 'Article',
				index: { fields: ['title', 'content'], opClass: 'varchar_pattern_ops', columnOptions: { content: { opClass: 'text_pattern_ops' } } },
			},
		],
		sql: SQL`CREATE INDEX ON "article" ("title" varchar_pattern_ops, "content" text_pattern_ops);`,
	}))

// The physical DROP matches by columns only, so two indexes on the same column differing only by
// per-column options both match — the handler must fail loudly rather than DROP both (CORR-1).
describe('drop one of two same-column indexes differing only by column options', () =>
	it('throws rather than dropping both physical indexes', () => {
		expect(() =>
			testGenerateSql(
				createSchema(SchemaWithPlainAndSortOrderIndex),
				[
					{
						modification: 'removeIndex',
						entityName: 'Article',
						fields: ['title'],
						columnOptions: { title: { order: 'desc' } },
					},
				],
				'',
				createDatabaseMetadata({
					foreignKeys: [],
					indexes: [
						{ tableName: 'article', columnNames: ['title'], indexName: 'idx_article_title_plain', unique: false },
						{ tableName: 'article', columnNames: ['title'], indexName: 'idx_article_title_desc', unique: false },
					],
					uniqueConstraints: [],
				}),
			)
		).toThrow(/unambiguously drop index/)
	}))
