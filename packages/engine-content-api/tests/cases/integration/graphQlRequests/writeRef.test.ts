import { expect, test } from 'bun:test'
import { execute, failedTransaction, SqlQuery, sqlTransaction, sqlWriteRef } from '../../../src/test.js'
import { c, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { Acl } from '@contember/schema'
import { GQL, SQL } from '../../../src/tags.js'
import { testUuid } from '../../../src/testUuid.js'
import { AllowAllPermissionFactory } from '@contember/schema-utils'
import { CannotCommitError, Connection } from '@contember/database'
import { createConnectionMock } from '@contember/database-tester'

namespace AuthorModel {
	export class Author {
		name = c.stringColumn()
	}
}

namespace SubOperationFailModel {
	export class Article {
		content = c.manyHasOne(ArticleContent)
	}

	export class ArticleContent {
		locales = c.oneHasMany(ArticleContentLocale, 'content')
	}

	export class ArticleContentLocale {
		content = c.manyHasOne(ArticleContent, 'locales')
		title = c.stringColumn()
	}
}

namespace ViewModel {
	export class Author {
		name = c.stringColumn()
	}

	@def.View('SELECT 1', { materialized: true })
	export class AuthorStats {
		postCount = c.intColumn().notNull()
	}
}

const createAuthorSql: SqlQuery = {
	sql: SQL`with "root_" as
		(select ? :: uuid as "id", ? :: text as "name")
		insert into "public"."author" ("id", "name")
		select "root_"."id", "root_"."name"
		from "root_"
		returning "id"`,
	parameters: [testUuid(1), 'John'],
	response: { rows: [{ id: testUuid(1) }] },
}

const createAuthorGql = GQL`
	mutation {
		createAuthor(data: {name: "John"}) {
			ok
		}
	}`

/** Makes the transaction reject on COMMIT, while the rest of the connection keeps behaving like the standard mock. */
const createFailingCommitConnectionMock = (queries: SqlQuery[]): Connection.ConnectionType => {
	const connection = createConnectionMock(queries)
	const transaction: Connection.ConnectionType['transaction'] = (trx, options) =>
		connection.transaction(inner =>
			trx(
				new Proxy(inner, {
					get: (target, prop, receiver) =>
						prop === 'commit'
							? () => Promise.reject(new CannotCommitError('commit failed', new Error('commit failed')))
							: Reflect.get(target, prop, receiver),
				}),
			), options)

	return new Proxy(connection, {
		get: (target, prop, receiver) => prop === 'transaction' ? transaction : Reflect.get(target, prop, receiver),
	})
}

test('records the write ref of a committed mutation', async () => {
	const recorded: string[] = []
	await execute({
		schema: createSchema(AuthorModel).model,
		writeRefSink: { record: xid => recorded.push(xid) },
		query: createAuthorGql,
		executes: [
			...sqlTransaction([
				createAuthorSql,
				sqlWriteRef('742'),
			]),
		],
		return: {
			data: {
				createAuthor: {
					ok: true,
				},
			},
		},
	})
	expect(recorded).toStrictEqual(['742'])
})

test('does not record a write ref when no transaction id was assigned', async () => {
	const recorded: string[] = []
	await execute({
		schema: createSchema(AuthorModel).model,
		writeRefSink: { record: xid => recorded.push(xid) },
		query: createAuthorGql,
		executes: [
			...sqlTransaction([
				createAuthorSql,
				sqlWriteRef(null),
			]),
		],
		return: {
			data: {
				createAuthor: {
					ok: true,
				},
			},
		},
	})
	expect(recorded).toStrictEqual([])
})

test('does not record a write ref when the mutation is rolled back', async () => {
	const recorded: string[] = []
	await execute({
		schema: createSchema(SubOperationFailModel).model,
		writeRefSink: { record: xid => recorded.push(xid) },
		query: GQL`
			mutation {
				createArticle(data: {content: {create: {locales: [{create: {title: "Title"}}]}}}) {
					ok
				}
			}`,
		executes: [
			...failedTransaction([
				{
					sql:
						SQL`with "root_" as (select ? :: uuid as "id") insert into "public"."article_content" ("id") select "root_"."id" from "root_" returning "id"`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql:
						SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: uuid as "content_id") insert into "public"."article_content_locale" ("id", "title", "content_id") select "root_"."id", "root_"."title", "root_"."content_id" from "root_" returning "id"`,
					parameters: [testUuid(3), 'Title', testUuid(2)],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				createArticle: {
					ok: false,
				},
			},
		},
	})
	expect(recorded).toStrictEqual([])
})

test('does not record a write ref when the commit fails', async () => {
	const recorded: string[] = []
	await execute({
		schema: createSchema(AuthorModel).model,
		writeRefSink: { record: xid => recorded.push(xid) },
		createConnection: createFailingCommitConnectionMock,
		query: createAuthorGql,
		executes: [
			...failedTransaction([
				createAuthorSql,
				sqlWriteRef('742'),
			]),
		],
		return: {
			data: {
				createAuthor: {
					ok: false,
				},
			},
		},
	})
	expect(recorded).toStrictEqual([])
})

const viewSchema = createSchema(ViewModel).model

const refreshViewPermissions = (): Acl.Permissions => {
	const permissions = new AllowAllPermissionFactory().create(viewSchema)
	return {
		...permissions,
		AuthorStats: {
			...permissions.AuthorStats,
			operations: { ...permissions.AuthorStats.operations, refreshMaterializedView: true },
		},
	}
}

const refreshViewGql = GQL`
	mutation {
		refreshMaterializedView(name: AuthorStats) {
			ok
		}
	}`

test('records the write ref of a materialized view refresh', async () => {
	const recorded: string[] = []
	await execute({
		schema: viewSchema,
		permissions: refreshViewPermissions(),
		writeRefSink: { record: xid => recorded.push(xid) },
		query: refreshViewGql,
		executes: [
			{ sql: 'BEGIN;', parameters: [], response: {} },
			{ sql: SQL`REFRESH MATERIALIZED VIEW "public"."author_stats"`, parameters: [], response: {} },
			sqlWriteRef('91'),
			{ sql: 'COMMIT;', parameters: [], response: {} },
		],
		return: {
			data: {
				refreshMaterializedView: {
					ok: true,
				},
			},
		},
	})
	expect(recorded).toStrictEqual(['91'])
})

test('refreshes a materialized view without a transaction when no sink is set', async () => {
	await execute({
		schema: viewSchema,
		permissions: refreshViewPermissions(),
		query: refreshViewGql,
		executes: [
			{ sql: SQL`REFRESH MATERIALIZED VIEW "public"."author_stats"`, parameters: [], response: {} },
		],
		return: {
			data: {
				refreshMaterializedView: {
					ok: true,
				},
			},
		},
	})
})

test('records the write ref of a concurrent materialized view refresh', async () => {
	const recorded: string[] = []
	await execute({
		schema: viewSchema,
		permissions: refreshViewPermissions(),
		writeRefSink: { record: xid => recorded.push(xid) },
		query: GQL`
			mutation {
				refreshMaterializedView(name: AuthorStats, options: {concurrently: true}) {
					ok
				}
			}`,
		executes: [
			{ sql: 'BEGIN;', parameters: [], response: {} },
			{ sql: SQL`REFRESH MATERIALIZED VIEW CONCURRENTLY "public"."author_stats"`, parameters: [], response: {} },
			sqlWriteRef('92'),
			{ sql: 'COMMIT;', parameters: [], response: {} },
		],
		return: {
			data: {
				refreshMaterializedView: {
					ok: true,
				},
			},
		},
	})
	expect(recorded).toStrictEqual(['92'])
})

test('records the write ref of a committed transaction mutation', async () => {
	const recorded: string[] = []
	await execute({
		schema: createSchema(AuthorModel).model,
		writeRefSink: { record: xid => recorded.push(xid) },
		query: GQL`
			mutation {
				transaction {
					ok
					createAuthor(data: {name: "John"}) {
						ok
					}
				}
			}`,
		executes: [
			...sqlTransaction([
				createAuthorSql,
				sqlWriteRef('743'),
			]),
		],
		return: {
			data: {
				transaction: {
					ok: true,
					createAuthor: {
						ok: true,
					},
				},
			},
		},
	})
	expect(recorded).toStrictEqual(['743'])
})
