import { Logger } from '@contember/logger'
import { Actions, Schema } from '@contember/schema'
import { DatabaseContext } from '@contember/engine-system-api'
import { EventRow } from '../model/types.js'
import { VariablesMap } from '../model/VariablesManager.js'

export type { EventRow }

export interface InvokeHandler<Target extends Actions.AnyTarget> {
	handle(args: InvokeHandlerArgs<Target>): Promise<HandledEvent[]>
}

export interface InvokeHandlerArgs<Target extends Actions.AnyTarget> {
	target: Target
	events: EventRow[]
	logger: Logger
	variables: VariablesMap
	/**
	 * Dispatch context always supplied by {@link EventDispatcher}. Optional only so
	 * that HTTP/webhook handlers — which never touch the database — can be invoked
	 * directly in unit tests without fabricating one. Internal targets that need it
	 * (e.g. the audit-log handler) assert its presence.
	 */
	db?: DatabaseContext
	/** Resolved content schema of the dispatched project (see {@link db}). */
	schema?: Schema
}

export type HandledEvent = {
	row: EventRow
	result: InvocationResult
	target?: Actions.AnyTarget
}

export type InvocationResult = {
	ok: boolean
	durationMs?: number
	errorMessage?: string
	code?: number
	response?: string
}
