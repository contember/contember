import { Logger } from '@contember/logger'
import { Actions } from '@contember/schema'
import { EventRow } from '../model/types'

export { EventRow }

export interface InvokeHandler<Type extends Actions.AnyTarget> {
	handle(invocation: Type, events: EventRow[], logger: Logger): Promise<HandledEvent[]>
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
