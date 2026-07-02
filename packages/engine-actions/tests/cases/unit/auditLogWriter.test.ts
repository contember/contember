import { describe, expect, test } from 'bun:test'
import { buildAuditLogRow } from '../../../src/audit/AuditLogWriter.js'
import { ActionsPayload } from '@contember/schema'
import { testUuid } from '../../src/uuid.js'

describe('buildAuditLogRow', () => {
	test('maps a watch payload to an audit row and dedupes nodes', () => {
		const createdAt = new Date('2024-06-20T12:00:00Z')
		const payload: ActionsPayload.WatchEventPayload = {
			operation: 'watch',
			trigger: 'book_audit',
			entity: 'Book',
			id: testUuid(1),
			events: [
				{
					operation: 'update',
					entity: 'Book',
					id: testUuid(1),
					values: { title: 'Hi' },
					old: { title: 'Hello' },
					nodes: [{ relation: '', entity: 'Book', id: testUuid(1) }],
				},
				{
					operation: 'update',
					entity: 'Tag',
					id: testUuid(2),
					values: { name: 'x' },
					nodes: [
						{ relation: 'tags', entity: 'Tag', id: testUuid(2) },
						{ relation: '', entity: 'Book', id: testUuid(1) },
					],
				},
			],
		}

		const row = buildAuditLogRow(payload, {
			createdAt,
			transactionId: testUuid(9),
			eventId: testUuid(7),
			identityId: testUuid(8),
			ipAddress: '127.0.0.1',
			userAgent: 'agent',
		})

		expect(row.createdAt).toBe(createdAt)
		expect(row.transactionId).toBe(testUuid(9))
		expect(row.identityId).toBe(testUuid(8))
		expect(row.rootEntity).toBe('Book')
		expect(row.rootId).toBe(testUuid(1))
		expect(row.trigger).toBe('book_audit')
		expect(row.nodes).toStrictEqual([
			{ id: testUuid(1), entity: 'Book' },
			{ id: testUuid(2), entity: 'Tag' },
		])
		expect(row.data).toStrictEqual({
			events: payload.events,
			meta: {
				transactionId: testUuid(9),
				eventId: testUuid(7),
				identityId: testUuid(8),
				ipAddress: '127.0.0.1',
				userAgent: 'agent',
			},
		})
	})

	test('handles a null identity, numeric id and events without nodes', () => {
		const payload: ActionsPayload.WatchEventPayload = {
			operation: 'watch',
			trigger: 't',
			entity: 'Book',
			id: 1,
			events: [{ operation: 'create', entity: 'Book', id: 1, values: {} }],
		}

		const row = buildAuditLogRow(payload, {
			createdAt: new Date('2024-06-20T12:00:00Z'),
			transactionId: testUuid(1),
			identityId: null,
			ipAddress: null,
			userAgent: null,
		})

		expect(row.identityId).toBeNull()
		expect(row.rootId).toBe('1')
		expect(row.nodes).toStrictEqual([])
	})
})
