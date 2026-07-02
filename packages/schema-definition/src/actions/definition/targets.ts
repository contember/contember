import { Actions } from '@contember/schema'
import { EntityConstructor } from '../../utils/index.js'

/**
 * `Omit` that distributes over a union, so per-member fields (e.g. a webhook's
 * `url`, an audit-log target's `entity`) survive — a plain `Omit<Union, K>`
 * collapses to the members' common keys and drops them.
 */
export type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never

/**
 * Sink-entity reference in the definition API: the entity class, or a `() => Entity`
 * thunk to sidestep forward/circular references (as with View `dependencies`). Resolved
 * to the entity name at schema-build time; the resulting schema keeps a plain name.
 */
export type EntityReference = EntityConstructor | (() => EntityConstructor)

export type WebhookTargetDefinition = Omit<Actions.WebhookTarget, 'name'>

/** Like {@link Actions.AuditLogTarget}, but `entity` is an {@link EntityReference}
 * rather than a resolved name. */
export type AuditLogTargetDefinition =
	& Omit<Actions.AuditLogTarget, 'name' | 'entity'>
	& { readonly entity: EntityReference }

export type AnyTargetDefinition =
	| WebhookTargetDefinition
	| AuditLogTargetDefinition

export class ActionsTarget {
	constructor(
		public readonly name: string | undefined,
		public readonly definition: AnyTargetDefinition,
	) {
	}
}

export const createTarget = ({
	name,
	...definition
}: AnyTargetDefinition & { name?: string }) => new ActionsTarget(name, definition)

/**
 * Declares a built-in audit-log target: fired triggers are persisted straight
 * into the `entity` content entity by the engine, replacing the webhook →
 * external-worker round-trip. `entity` is the sink entity class (or a `() => Entity`
 * thunk). Reference it from a `@watch({ ..., target })` trigger (typically with
 * `withNodes: true`). See {@link Actions.AuditLogTarget}.
 */
export const createAuditLogTarget = ({
	name,
	...definition
}: Omit<AuditLogTargetDefinition, 'type'> & { name?: string }) => new ActionsTarget(name, { type: 'auditLog', ...definition })
