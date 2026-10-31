import { c } from '../../../src/index.js'
import { expect, test } from 'bun:test'
import { createActions } from '../../../src/actions/definition/index.js'

namespace AuditActions {
	export const auditLog = c.createAuditLogTarget({
		name: 'audit_log_target',
		entity: () => AuditLog,
		synchronous: true,
	})

	@c.Watch({
		name: 'book_audit',
		watch: `title`,
		withNodes: true,
		target: auditLog,
	})
	export class Book {
		title = c.stringColumn()
	}

	export class AuditLog {
		createdAt = c.dateTimeColumn().notNull().default('now')
		transactionId = c.uuidColumn().notNull()
		rootEntity = c.stringColumn().notNull()
		rootId = c.uuidColumn().notNull()
		data = c.jsonColumn().notNull()
	}
}

test('audit-log target survives target resolution with its entity field', () => {
	const actions = createActions(AuditActions)
	expect(actions.targets).toStrictEqual({
		audit_log_target: {
			name: 'audit_log_target',
			type: 'auditLog',
			entity: 'AuditLog',
			synchronous: true,
		},
	})
	expect(actions.triggers.book_audit).toStrictEqual({
		type: 'watch',
		name: 'book_audit',
		entity: 'Book',
		target: 'audit_log_target',
		watch: ['title'],
		selection: undefined,
		priority: undefined,
		withNodes: true,
	})
})

namespace InlineAudit {
	export class AuditLog {
		transactionId = c.uuidColumn().notNull()
		rootEntity = c.stringColumn().notNull()
		rootId = c.uuidColumn().notNull()
		data = c.jsonColumn().notNull()
	}

	@c.Watch({
		name: 'inline_book_audit',
		watch: `title`,
		target: { type: 'auditLog', entity: AuditLog },
	})
	export class Book {
		title = c.stringColumn()
	}
}

test('inline audit-log target auto-names to <trigger>_target', () => {
	const actions = createActions(InlineAudit)
	expect(actions.targets.inline_book_audit_target).toStrictEqual({
		name: 'inline_book_audit_target',
		type: 'auditLog',
		entity: 'AuditLog',
	})
})

namespace UnregisteredSink {
	// Not exported, so it is never registered as an entity.
	class NotExported extends c.AuditLogEntity {
	}

	@c.Watch({
		name: 'book_audit',
		watch: `title`,
		target: { type: 'auditLog', entity: NotExported },
	})
	export class Book {
		title = c.stringColumn()
	}
}

test('audit-log target referencing a non-registered entity throws', () => {
	let error: unknown
	try {
		createActions(UnregisteredSink)
	} catch (e) {
		error = e
	}
	expect(String(error)).toContain('not a registered entity')
})
