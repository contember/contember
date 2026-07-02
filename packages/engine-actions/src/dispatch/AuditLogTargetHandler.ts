import { Actions } from '@contember/schema'
import { StagesQuery } from '@contember/engine-system-api'
import { HandledEvent, InvokeHandler, InvokeHandlerArgs } from './types.js'
import { AuditLogWriter, buildAuditLogRow } from '../audit/AuditLogWriter.js'

/**
 * Dispatch-time handler for asynchronous audit-log targets: an engine-side
 * short-circuit replacing the webhook → external-worker round-trip. It reuses
 * the queue's retry/backoff (a failed write is retried like a failed webhook),
 * resolving each event's stage to its content schema and writing the audit row
 * with full permissions via {@link AuditLogWriter}.
 */
export class AuditLogTargetHandler implements InvokeHandler<Actions.AuditLogTarget> {
	constructor(
		private readonly writer: AuditLogWriter,
	) {
	}

	public async handle({ target, events, db, schema, logger }: InvokeHandlerArgs<Actions.AuditLogTarget>): Promise<HandledEvent[]> {
		if (!db || !schema) {
			throw new Error('AuditLogTargetHandler requires the dispatch database context and content schema')
		}
		const stages = await db.queryHandler.fetch(new StagesQuery())
		const stageById = new Map(stages.map(stage => [stage.id, stage]))

		const results: HandledEvent[] = []
		for (const event of events) {
			const start = process.hrtime.bigint()
			const getDuration = () => Math.floor(Number((process.hrtime.bigint() - start) / BigInt(1_000_000)))
			try {
				if (event.payload.operation !== 'watch') {
					throw new Error(`Audit-log target ${target.name} can only process watch trigger payloads.`)
				}
				const stage = stageById.get(event.stage_id)
				if (!stage) {
					throw new Error(`Stage ${event.stage_id} not found`)
				}
				const row = buildAuditLogRow(event.payload, {
					createdAt: event.created_at,
					transactionId: event.transaction_id,
					eventId: event.id,
					identityId: event.identity_id,
					ipAddress: event.ip_address,
					userAgent: event.user_agent,
				})
				await this.writer.write(db.client.forSchema(stage.schema), schema, target.entity, row, {
					primaryValue: event.id,
					ignorePrimaryConflict: true,
					rootRelation: target.rootRelation,
				})
				results.push({ target, row: event, result: { ok: true, durationMs: getDuration() } })
			} catch (e) {
				logger.warn(e)
				results.push({
					target,
					row: event,
					result: { ok: false, durationMs: getDuration(), errorMessage: e instanceof Error ? e.message : String(e) },
				})
			}
		}
		return results
	}
}
