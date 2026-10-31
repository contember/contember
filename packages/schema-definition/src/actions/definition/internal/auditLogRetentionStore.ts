import { createMetadataStore } from '../../../utils/index.js'
import { Input, Retention } from '@contember/schema'
import { EntityReference } from '../targets.js'

/**
 * Retention config accepted by `@AuditLog({ retention })`. Same options as `@c.Retention`, except the
 * target is the audit sink (not the decorated entity) and `olderThan.field` defaults to `createdAt`
 * (which every `AuditLogEntity` has).
 */
export type AuditLogRetentionDefinition = {
	readonly name?: string
	readonly olderThan?: { readonly field?: string; readonly interval: string }
	readonly where?: Input.Where
	readonly schedule?: Retention.Schedule
	readonly strategy?: Retention.Strategy
	readonly batchSize?: number
	readonly maxPerRun?: number
}

/** A deferred `@AuditLog` retention policy — the sink ref is resolved to a name at schema-build time. */
export interface AuditLogRetentionIntent {
	readonly sink: EntityReference
	readonly retention: AuditLogRetentionDefinition
}

/** Keyed by the audited entity (available at decorator time); the sink is resolved later, like the target. */
export const auditLogRetentionStore = createMetadataStore<AuditLogRetentionIntent[]>([])
