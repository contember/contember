import { c, createSchema } from '../../../src/index.js'
import { expect, test } from 'bun:test'
import { SchemaValidator } from '@contember/schema-utils'
import { Model } from '@contember/schema'

namespace AutoAuditModel {
	@c.AuditLog({ watch: `title`, entity: () => ArticleAuditLog })
	export class Article {
		title = c.stringColumn()
	}

	export class ArticleAuditLog extends c.AuditLogEntity {
	}
}

test('@AuditLog wires an explicit sink entity, watch trigger and target', () => {
	const schema = createSchema(AutoAuditModel)

	// Sink entity inherits the convention columns and indexes.
	const auditLog = schema.model.entities['ArticleAuditLog']
	expect(auditLog).toBeDefined()
	expect(Object.keys(auditLog.fields).sort()).toStrictEqual(
		['createdAt', 'data', 'eventNo', 'id', 'identityId', 'nodes', 'rootEntity', 'rootId', 'transactionId', 'trigger'],
	)
	const eventNo = auditLog.fields.eventNo
	if (eventNo.type !== Model.ColumnType.Int) {
		throw new Error('Expected ArticleAuditLog.eventNo to be an int column.')
	}
	expect(auditLog.fields.data.type).toBe(Model.ColumnType.Json)
	expect(eventNo.sequence).toStrictEqual({ precedence: 'BY DEFAULT' })
	expect(auditLog.fields.rootId.type).toBe(Model.ColumnType.String)
	expect(auditLog.fields.transactionId.type).toBe(Model.ColumnType.Uuid)

	// Event log is disabled on the sink (inherited from AuditLogEntity) — no double logging.
	expect(auditLog.eventLog.enabled).toBe(false)

	// Immutable (inherited from AuditLogEntity) — Content API generates no create/update/delete.
	expect(auditLog.immutable).toBe(true)

	// Indexes: createdAt, eventNo, (rootEntity, rootId) btree + GIN on nodes.
	expect(auditLog.indexes.some(it => it.fields.join(',') === 'createdAt')).toBe(true)
	expect(auditLog.indexes.some(it => it.fields.join(',') === 'eventNo')).toBe(true)
	expect(auditLog.indexes.some(it => it.fields.join(',') === 'rootEntity,rootId')).toBe(true)
	expect(auditLog.indexes.some(it => it.fields.join(',') === 'nodes' && it.method === 'gin')).toBe(true)

	// Watch trigger (withNodes) + inline auditLog target.
	const trigger = schema.actions.triggers.article_audit
	expect(trigger).toMatchObject({ type: 'watch', entity: 'Article', withNodes: true, watch: ['title'] })
	expect(schema.actions.targets[trigger.target]).toMatchObject({ type: 'auditLog', entity: 'ArticleAuditLog' })

	// The explicit entity is valid against the shared column spec.
	expect(SchemaValidator.validate(schema).filter(it => it.code.startsWith('ACTIONS_AUDIT_LOG'))).toStrictEqual([])
})

namespace RootRelationAuditModel {
	@c.AuditLog({ watch: `title`, entity: () => ArticleAuditLog, rootRelation: 'article' })
	export class Article {
		title = c.stringColumn()
	}

	@c.Index('article')
	export class ArticleAuditLog extends c.AuditLogEntity {
		article = c.manyHasOne(Article).setNullOnDelete()
	}
}

test('@AuditLog: rootRelation points to an explicitly declared relation', () => {
	const schema = createSchema(RootRelationAuditModel)
	const auditLog = schema.model.entities['ArticleAuditLog']
	const relation = auditLog.fields.article
	if (relation.type !== Model.RelationType.ManyHasOne) {
		throw new Error('Expected ArticleAuditLog.article to be a many-has-one relation.')
	}
	expect(relation.target).toBe('Article')
	expect(relation.nullable).toBe(true)
	expect(relation.joiningColumn).toStrictEqual({ columnName: 'article_id', onDelete: Model.OnDelete.setNull })
	expect(auditLog.indexes.some(it => it.fields.join(',') === 'article')).toBe(true)

	const trigger = schema.actions.triggers.article_audit
	expect(schema.actions.targets[trigger.target]).toMatchObject({ type: 'auditLog', entity: 'ArticleAuditLog', rootRelation: 'article' })
	expect(SchemaValidator.validate(schema).filter(it => it.code.startsWith('ACTIONS_AUDIT_LOG'))).toStrictEqual([])
})

namespace SharedSinkModel {
	@c.AuditLog({ watch: `title`, entity: () => CommonAudit, synchronous: true })
	export class Article {
		title = c.stringColumn()
	}

	@c.AuditLog({ watch: `name`, entity: () => CommonAudit, synchronous: true })
	export class Author {
		name = c.stringColumn()
	}

	export class CommonAudit extends c.AuditLogEntity {
	}
}

test('@AuditLog: multiple entities can share one explicit sink', () => {
	const schema = createSchema(SharedSinkModel)

	expect(schema.model.entities['CommonAudit']).toBeDefined()
	expect(schema.model.entities['ArticleAuditLog']).toBeUndefined()
	expect(schema.model.entities['AuthorAuditLog']).toBeUndefined()

	const articleTarget = schema.actions.targets[schema.actions.triggers.article_audit.target]
	const authorTarget = schema.actions.targets[schema.actions.triggers.author_audit.target]
	expect(articleTarget).toMatchObject({ type: 'auditLog', entity: 'CommonAudit', synchronous: true })
	expect(authorTarget).toMatchObject({ type: 'auditLog', entity: 'CommonAudit', synchronous: true })
})

namespace UserSinkModel {
	@c.AuditLog({ watch: `title`, entity: () => MyAudit })
	export class Article {
		title = c.stringColumn()
	}

	// Custom sink with an extra column.
	@c.Immutable()
	export class MyAudit {
		createdAt = c.dateTimeColumn().notNull().default('now')
		transactionId = c.uuidColumn().notNull()
		rootEntity = c.stringColumn().notNull()
		rootId = c.stringColumn().notNull()
		data = c.jsonColumn().notNull()
		customField = c.stringColumn()
	}
}

test('@AuditLog: a user-defined sink entity is left untouched', () => {
	const schema = createSchema(UserSinkModel)
	expect(schema.model.entities['MyAudit'].fields.customField).toBeDefined()
	expect(SchemaValidator.validate(schema).filter(it => it.code.startsWith('ACTIONS_AUDIT_LOG'))).toStrictEqual([])
})

namespace MutableSinkModel {
	@c.AuditLog({ watch: `title`, entity: () => MutableAudit })
	export class Article {
		title = c.stringColumn()
	}

	// Valid columns, but NOT immutable — the Content API would expose create/update/delete.
	export class MutableAudit {
		transactionId = c.uuidColumn().notNull()
		rootEntity = c.stringColumn().notNull()
		rootId = c.stringColumn().notNull()
		data = c.jsonColumn().notNull()
	}
}

test('audit-log sink must be immutable', () => {
	const schema = createSchema(MutableSinkModel)
	expect(SchemaValidator.validate(schema).map(it => it.code)).toContain('ACTIONS_AUDIT_LOG_MUTABLE_ENTITY')
})

namespace BadSinkModel {
	@c.AuditLog({ watch: `title`, entity: () => BadAudit })
	export class Article {
		title = c.stringColumn()
	}

	// Missing the required `data` column and a wrong-typed `rootEntity`.
	export class BadAudit {
		transactionId = c.uuidColumn().notNull()
		rootEntity = c.intColumn()
		rootId = c.uuidColumn().notNull()
	}
}

test('audit-log entity validation reports missing/mistyped columns', () => {
	const schema = createSchema(BadSinkModel)
	const errors = SchemaValidator.validate(schema)
	const codes = errors.map(it => it.code)
	expect(codes).toContain('ACTIONS_AUDIT_LOG_MISSING_COLUMN') // data
	expect(codes).toContain('ACTIONS_AUDIT_LOG_INVALID_COLUMN') // rootEntity is Int, must be String
})

namespace BasicTriggerAuditModel {
	export const auditLog = c.createAuditLogTarget({
		name: 'book_audit_target',
		entity: () => AuditLog,
	})

	@c.Trigger({
		name: 'book_audit',
		create: true,
		target: auditLog,
	})
	export class Book {
		title = c.stringColumn()
	}

	export class AuditLog {
		transactionId = c.uuidColumn().notNull()
		rootEntity = c.stringColumn().notNull()
		rootId = c.uuidColumn().notNull()
		data = c.jsonColumn().notNull()
	}
}

test('audit-log targets are rejected on basic triggers', () => {
	const schema = createSchema(BasicTriggerAuditModel)
	const errors = SchemaValidator.validate(schema)
	expect(errors.map(it => it.code)).toContain('ACTIONS_AUDIT_LOG_INVALID_TRIGGER')
})

namespace BadRootRelationAuditModel {
	export class Article {
		title = c.stringColumn()
	}

	export class Author {
		name = c.stringColumn()
	}

	export class AuditLog {
		transactionId = c.uuidColumn().notNull()
		rootEntity = c.stringColumn().notNull()
		rootId = c.stringColumn().notNull()
		data = c.jsonColumn().notNull()
		author = c.manyHasOne(Author).setNullOnDelete()
	}

	export const auditLog = c.createAuditLogTarget({
		name: 'book_audit_target',
		entity: AuditLog,
		rootRelation: 'author',
	})

	@c.Watch({
		name: 'article_audit',
		watch: `title`,
		target: auditLog,
	})
	export class WatchedArticle extends Article {
	}
}

test('audit-log root relation must target the watched entity', () => {
	const schema = createSchema(BadRootRelationAuditModel)
	const errors = SchemaValidator.validate(schema)
	expect(errors.map(it => it.code)).toContain('ACTIONS_AUDIT_LOG_INVALID_ROOT_RELATION')
})

namespace BadEventNoAuditModel {
	@c.AuditLog({ watch: `title`, entity: () => AuditLog })
	export class Article {
		title = c.stringColumn()
	}

	export class AuditLog {
		transactionId = c.uuidColumn().notNull()
		rootEntity = c.stringColumn().notNull()
		rootId = c.stringColumn().notNull()
		eventNo = c.intColumn().notNull()
		data = c.jsonColumn().notNull()
	}
}

test('audit-log eventNo must be backed by a sequence when present', () => {
	const schema = createSchema(BadEventNoAuditModel)
	const errors = SchemaValidator.validate(schema)
	expect(errors.map(it => it.code)).toContain('ACTIONS_AUDIT_LOG_INVALID_COLUMN')
})

namespace RetentionSugarModel {
	@c.AuditLog({ watch: `title`, entity: () => ArticleAuditLog, retention: { olderThan: { interval: '90 days' } } })
	export class Article {
		title = c.stringColumn()
	}

	export class ArticleAuditLog extends c.AuditLogEntity {
	}
}

test('@AuditLog: retention sugar emits a policy on the sink (createdAt default)', () => {
	const schema = createSchema(RetentionSugarModel)

	// Policy targets the SINK, not the audited entity, with olderThan.field defaulted to createdAt.
	const policy = schema.retention.policies['article_audit_log_retention']
	expect(policy).toBeDefined()
	expect(policy).toMatchObject({
		entity: 'ArticleAuditLog',
		strategy: 'raw',
		olderThan: { field: 'createdAt', interval: '90 days' },
	})
	expect(SchemaValidator.validate(schema).filter(it => it.code.startsWith('RETENTION'))).toStrictEqual([])
})
