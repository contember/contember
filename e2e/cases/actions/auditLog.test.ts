import { ActionsDefinition as actions, createSchema, SchemaDefinition as def } from '@contember/schema-definition'
import { expect, test } from 'bun:test'
import { createTester, gql } from '../../src/tester.js'

namespace SyncAuditModel {
	export const auditLogTarget = actions.createAuditLogTarget({
		name: 'audit_log_target',
		entity: () => AuditLog,
		synchronous: true,
	})

	@actions.watch({
		name: 'article_audit',
		watch: `title`,
		withNodes: true,
		target: auditLogTarget,
	})
	export class Article {
		title = def.stringColumn().unique()
	}

	@def.Immutable()
	export class AuditLog {
		createdAt = def.dateTimeColumn().notNull().default('now')
		transactionId = def.uuidColumn().notNull()
		identityId = def.uuidColumn()
		rootEntity = def.stringColumn().notNull()
		rootId = def.stringColumn().notNull()
		trigger = def.stringColumn()
		eventNo = def.intColumn().notNull().sequence()
		data = def.jsonColumn().notNull()
		nodes = def.jsonColumn()
	}
}

namespace AsyncAuditModel {
	export const auditLogTarget = actions.createAuditLogTarget({
		name: 'audit_log_target',
		entity: () => AuditLog,
		synchronous: false,
	})

	@actions.watch({
		name: 'article_audit',
		watch: `title`,
		withNodes: true,
		target: auditLogTarget,
	})
	export class Article {
		title = def.stringColumn().unique()
	}

	@def.Immutable()
	export class AuditLog {
		createdAt = def.dateTimeColumn().notNull().default('now')
		transactionId = def.uuidColumn().notNull()
		identityId = def.uuidColumn()
		rootEntity = def.stringColumn().notNull()
		rootId = def.stringColumn().notNull()
		trigger = def.stringColumn()
		eventNo = def.intColumn().notNull().sequence()
		data = def.jsonColumn().notNull()
		nodes = def.jsonColumn()
	}
}

namespace DecoratorAuditModel {
	@actions.auditLog({ watch: `title`, entity: () => ArticleAuditLog, synchronous: true, rootRelation: 'article' })
	export class Article {
		title = def.stringColumn().unique()
	}

	export class ArticleAuditLog extends actions.AuditLogEntity {
		article = def.manyHasOne(Article).setNullOnDelete()
	}
}

namespace AsyncRootRelationAuditModel {
	@actions.auditLog({ watch: `title`, entity: () => ArticleAuditLog, synchronous: false, rootRelation: 'article' })
	export class Article {
		title = def.stringColumn().unique()
	}

	export class ArticleAuditLog extends actions.AuditLogEntity {
		article = def.manyHasOne(Article).setNullOnDelete()
	}
}

const listArticleAuditLogQuery = gql`
	query {
		listArticleAuditLog(orderBy: [{ eventNo: asc }]) {
			rootId
			data
			article { id }
		}
	}
`

const listAuditLogQuery = gql`
	query {
		listAuditLog(orderBy: [{ createdAt: asc }]) {
			eventNo
			rootEntity
			rootId
			trigger
			data
			nodes
		}
	}
`

type AuditLogListRow = {
	readonly eventNo: number
	readonly rootEntity: string
	readonly rootId: string
	readonly trigger: string
	readonly data: {
		readonly events: readonly {
			readonly operation: string
			readonly values: Record<string, unknown>
			readonly old: Record<string, unknown>
		}[]
	}
	readonly nodes?: unknown
}

test('audit log: synchronous target writes a row in the same transaction', async () => {
	const schema = createSchema(SyncAuditModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
		mutation {
			createArticle(data: { title: "Hello world" }) {
				ok
				node { id }
			}
		}
	`).expect(200)
	const articleId = res.body.data.createArticle.node.id

	// Written synchronously — visible immediately, no dispatch needed.
	const auditRes = await tester(listAuditLogQuery).expect(200)
	const rows = auditRes.body.data.listAuditLog
	expect(rows).toBeArrayOfSize(1)
	expect(rows[0].rootEntity).toBe('Article')
	expect(rows[0].rootId).toBe(articleId)
	expect(rows[0].trigger).toBe('article_audit')
	expect(rows[0].eventNo).toBe(1)
	expect(rows[0].data.events[0].operation).toBe('create')
	expect(rows[0].data.events[0].values.title).toBe('Hello world')
	expect(Array.isArray(rows[0].nodes)).toBe(true)

	// A subsequent update appends a second, independent audit row.
	await tester(gql`
		mutation {
			updateArticle(by: { title: "Hello world" }, data: { title: "Hi!" }) {
				ok
			}
		}
	`).expect(200)
	const auditRes2 = await tester(listAuditLogQuery).expect(200)
	const rows2 = auditRes2.body.data.listAuditLog
	expect(rows2).toBeArrayOfSize(2)
	expect(rows2[1].eventNo).toBe(2)
	expect(rows2[1].data.events[0].operation).toBe('update')
	expect(rows2[1].data.events[0].old.title).toBe('Hello world')
})

test('audit log: asynchronous target writes via the dispatch queue', async () => {
	const schema = createSchema(AsyncAuditModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
		mutation {
			createArticle(data: { title: "Hello world" }) {
				ok
				node { id }
			}
		}
	`).expect(200)
	const articleId = res.body.data.createArticle.node.id

	// Dispatch is asynchronous: nudge the queue with processBatch and poll until the
	// row lands (robust whether or not the background worker also fires).
	let rows: AuditLogListRow[] = []
	for (let i = 0; i < 30; i++) {
		await tester(gql`mutation { processBatch { ok } }`, { path: '/actions/' + tester.projectSlug }).expect(200)
		const auditRes = await tester(listAuditLogQuery).expect(200)
		rows = auditRes.body.data.listAuditLog
		if (rows.length >= 1) {
			break
		}
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	expect(rows).toBeArrayOfSize(1)
	expect(rows[0].rootEntity).toBe('Article')
	expect(rows[0].rootId).toBe(articleId)
	expect(rows[0].trigger).toBe('article_audit')
	expect(rows[0].eventNo).toBe(1)
	expect(rows[0].data.events[0].operation).toBe('create')
})

test('audit log: @AuditLog writes to an explicit sink entity end-to-end', async () => {
	const schema = createSchema(DecoratorAuditModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
		mutation {
			createArticle(data: { title: "Hello world" }) {
				ok
				node { id }
			}
		}
	`).expect(200)
	const articleId = res.body.data.createArticle.node.id

	// The explicit `ArticleAuditLog` entity is queryable via the content API.
	const auditRes = await tester(gql`
		query {
			listArticleAuditLog(orderBy: [{ createdAt: asc }]) {
				eventNo
				rootEntity
				rootId
				trigger
				data
				article { id }
			}
		}
	`).expect(200)
	const rows = auditRes.body.data.listArticleAuditLog
	expect(rows).toBeArrayOfSize(1)
	expect(rows[0].eventNo).toBe(1)
	expect(rows[0].rootEntity).toBe('Article')
	expect(rows[0].rootId).toBe(articleId)
	expect(rows[0].trigger).toBe('article_audit')
	expect(rows[0].article.id).toBe(articleId)
	expect(rows[0].data.events[0].operation).toBe('create')

	// The sink is immutable (extends AuditLogEntity): the Content API exposes no
	// create/update/delete mutations for it, so no role can forge, tamper or destroy rows.
	const forge = await tester(gql`
		mutation { createArticleAuditLog(data: { rootEntity: "Article", rootId: "x", data: "{}" }) { ok } }
	`).expect(400)
	expect(forge.body.errors[0].message).toContain('createArticleAuditLog')

	const tamper = await tester(gql`
		mutation { updateArticleAuditLog(by: { id: "x" }, data: { rootEntity: "x" }) { ok } }
	`).expect(400)
	expect(tamper.body.errors[0].message).toContain('updateArticleAuditLog')

	const destroy = await tester(gql`
		mutation { deleteArticleAuditLog(by: { id: "x" }) { ok } }
	`).expect(400)
	expect(destroy.body.errors[0].message).toContain('deleteArticleAuditLog')
	// Deleting the root records a delete row; the root relation is left null because the
	// root row is already gone, and rootId keeps the identity.
	const deleted = await tester(gql`
		mutation { deleteArticle(by: { title: "Hello world" }) { ok errorMessage } }
	`).expect(200)
	expect(deleted.body.data.deleteArticle).toStrictEqual({ ok: true, errorMessage: null })

	const afterDelete = (await tester(listArticleAuditLogQuery).expect(200)).body.data.listArticleAuditLog
	expect(afterDelete).toBeArrayOfSize(2)
	expect(afterDelete[0].article).toBeNull()
	expect(afterDelete[1].article).toBeNull()
	expect(afterDelete[1].rootId).toBe(articleId)
	expect(afterDelete[1].data.events[0].operation).toBe('delete')
})

test('audit log: asynchronous rootRelation rows survive a root deleted before dispatch', async () => {
	const schema = createSchema(AsyncRootRelationAuditModel)
	const tester = await createTester(schema)

	const res = await tester(gql`
		mutation { createArticle(data: { title: "Hello world" }) { ok node { id } } }
	`).expect(200)
	const articleId = res.body.data.createArticle.node.id
	const deleted = await tester(gql`
		mutation { deleteArticle(by: { title: "Hello world" }) { ok } }
	`).expect(200)
	expect(deleted.body.data.deleteArticle.ok).toBe(true)

	let rows: { readonly rootId: string; readonly article: null | { readonly id: string }; readonly data: AuditLogListRow['data'] }[] = []
	for (let i = 0; i < 30; i++) {
		await tester(gql`mutation { processBatch { ok } }`, { path: '/actions/' + tester.projectSlug }).expect(200)
		rows = (await tester(listArticleAuditLogQuery).expect(200)).body.data.listArticleAuditLog
		if (rows.length >= 2) {
			break
		}
		await new Promise(resolve => setTimeout(resolve, 100))
	}

	expect(rows.map(it => it.data.events[0].operation)).toStrictEqual(['create', 'delete'])
	expect(rows.every(it => it.rootId === articleId && it.article === null)).toBe(true)
})
