import { ContentEvent } from '@contember/engine-common'
import { Client } from '@contember/database'
import { Acl, Schema } from '@contember/schema'

export interface ContentEventApplyOkResult {
	readonly ok: true
	readonly appliedEvents: ContentEvent[]
}

export interface ContentEventApplyErrorResult {
	readonly ok: false
	readonly appliedEvents: ContentEvent[]
	readonly failedEvent: ContentEvent
}

export interface ContentEventApplierContext {
	db: Client
	schema: Schema
	identityVariables: Acl.VariablesMap
	roles: string[]
}

export type ContentEventApplyResult = ContentEventApplyOkResult | ContentEventApplyErrorResult

export interface ContentEventsApplier {
	apply(context: ContentEventApplierContext, events: ContentEvent[]): Promise<ContentEventApplyResult>
}
