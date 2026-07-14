import { Client, InsertBuilder } from '@contember/database'
import { Mapper, TriggeredActionEvent, TriggeredActionsCollector } from '@contember/engine-content-api'
import { Actions, ActionsPayload, Schema } from '@contember/schema'
import { EventRow } from '../model/types.js'
import { notify } from '../utils/notifyChannel.js'
import { ProjectActionsMetrics } from '../ActionsMetrics.js'
import { AuditLogWriter, buildAuditLogRow } from '../audit/AuditLogWriter.js'

type EventRowToInsert = Omit<EventRow, 'created_at' | 'visible_at' | 'last_state_change' | 'log'> & {
	created_at: string | Date
	visible_at: string | Date
	last_state_change: string | Date
}

export class TriggerPayloadPersister {
	constructor(
		private readonly mapper: Mapper,
		private readonly client: Client,
		private readonly providers: { uuid: () => string },
		private readonly projectSlug: string,
		private readonly stageId: string,
		private readonly schemaId: number | undefined,
		private readonly identityId: string,
		private readonly userInfo: { ipAddress: string | null; userAgent: string | null },
		private readonly triggeredActionsCollector: TriggeredActionsCollector | undefined,
		private readonly metrics: ProjectActionsMetrics | undefined,
		private readonly schema: Schema,
		private readonly auditLogWriter: AuditLogWriter,
	) {
	}

	public async persist(trigger: Actions.AnyTrigger, payloads: ActionsPayload.AnyEventPayload[]): Promise<void> {
		const target = this.schema.actions.targets[trigger.target]
		// Synchronous audit-log short-circuit: write the audit row in this very
		// transaction and skip the actions_event queue entirely.
		if (target?.type === 'auditLog' && target.synchronous) {
			await this.persistAuditLog(target, payloads)
			return
		}

		const chunkSize = 100
		if (!this.schemaId) {
			throw new Error('Schema id is not set')
		}
		const collector = this.triggeredActionsCollector
		for (let i = 0; i < payloads.length; i += chunkSize) {
			const chunk = payloads.slice(i, i + chunkSize)
			const collected: TriggeredActionEvent[] | undefined = collector ? [] : undefined
			const rows = chunk.map((it): EventRowToInsert => {
				const id = this.providers.uuid()
				const transactionId = this.mapper.transactionId
				collected?.push({ id, trigger: trigger.name, target: trigger.target, transactionId })
				return {
					id,
					transaction_id: transactionId,
					created_at: 'now',
					visible_at: 'now',
					num_retries: 0,
					state: 'created',
					stage_id: this.stageId,
					schema_id: this.schemaId!,
					target: trigger.target,
					trigger: trigger.name,
					priority: trigger.priority ?? 0,
					payload: it,
					resolved_at: null,
					last_state_change: 'now',
					identity_id: this.identityId,
					ip_address: this.userInfo.ipAddress,
					user_agent: this.userInfo.userAgent,
				}
			})
			await InsertBuilder.create()
				.into('actions_event')
				.values(rows)
				.execute(this.client)

			// Counted before commit (events are written in the mutation's transaction); a rollback
			// would over-count enqueued. Acceptable for a backlog *trend*, which is the intended use.
			this.metrics?.enqueued(rows.length)

			if (collected && collected.length > 0) {
				collector!.add(collected)
			}
		}

		await notify(this.client, this.projectSlug)
	}

	private async persistAuditLog(target: Actions.AuditLogTarget, payloads: ActionsPayload.AnyEventPayload[]): Promise<void> {
		const createdAt = new Date()
		for (const payload of payloads) {
			if (payload.operation !== 'watch') {
				throw new Error(`Audit-log target ${target.name} can only process watch trigger payloads.`)
			}
			const row = buildAuditLogRow(payload, {
				createdAt,
				transactionId: this.mapper.transactionId,
				identityId: this.identityId,
				ipAddress: this.userInfo.ipAddress,
				userAgent: this.userInfo.userAgent,
			})
			// `mapper.db` is the content client bound to this stage's schema — the same
			// place the audit content entity lives.
			await this.auditLogWriter.write(this.mapper.db, this.schema, target.entity, row, { rootRelation: target.rootRelation })
		}
	}
}
