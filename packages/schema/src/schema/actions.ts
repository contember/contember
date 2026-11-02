import { JSONObject } from './json.js'

export namespace Actions {
	export type SelectionNodeSub = readonly [name: string, args: JSONObject, fields: SelectionNode]
	export type SelectionNode = readonly (string | SelectionNodeSub)[]

	export type AnyTarget =
		| WebhookTarget
		| AuditLogTarget

	export type WebhookTarget = {
		readonly type: 'webhook'
		readonly name: string
		readonly url: string
		readonly headers?: {
			readonly [key: string]: string
		}
		readonly body?: JSONObject
		readonly payloadPath?: readonly string[]
		readonly timeoutMs?: number
		readonly maxAttempts?: number
		readonly initialRepeatIntervalMs?: number
		readonly batchSize?: number
	}

	/**
	 * Built-in target that persists a fired trigger straight into a content entity
	 * as an append-only audit row — an engine-side short-circuit that replaces the
	 * webhook → external-worker → content-mutation round-trip. Rows are written with
	 * full permissions (bypassing content ACL by construction), so no application
	 * role may forge them. Intended for `watch` triggers with `withNodes: true`.
	 *
	 * `entity` names the content entity to write into; recognised columns are filled
	 * by convention (`transactionId`, `identityId`, `rootEntity`, `rootId`, `trigger`,
	 * `eventNo`, `data`, `nodes`, `createdAt`) — any that the entity omits are skipped.
	 * `rootRelation`, when set, names a many-has-one relation on the sink entity
	 * pointing to the trigger root entity; its joining column is filled with `rootId`.
	 *
	 * `synchronous: true` writes the row in the same transaction as the audited
	 * change (atomic, bypasses the dispatch queue). Otherwise the row is written
	 * asynchronously by the dispatch worker, reusing the queue's retry/backoff.
	 */
	export type AuditLogTarget = {
		readonly type: 'auditLog'
		readonly name: string
		readonly entity: string
		readonly rootRelation?: string
		readonly synchronous?: boolean
		readonly maxAttempts?: number
		readonly initialRepeatIntervalMs?: number
		readonly batchSize?: number
	}

	export type AnyTrigger =
		| BasicTrigger
		| WatchTrigger

	export type TriggerCommon = {
		readonly name: string
		readonly selection?: SelectionNode
		readonly target: string
		readonly priority?: number
	}

	export type BasicTrigger =
		& TriggerCommon
		& {
			readonly type: 'basic'
			readonly entity: string
			readonly create: boolean
			readonly delete: boolean
			readonly update: boolean | readonly string[]
		}

	export type WatchTrigger =
		& TriggerCommon
		& {
			readonly type: 'watch'
			readonly entity: string
			readonly watch: SelectionNode
			readonly withNodes?: boolean
		}

	export type Schema = {
		readonly triggers: {
			readonly [name: string]: AnyTrigger
		}
		readonly targets: {
			readonly [name: string]: AnyTarget
		}
	}
}
