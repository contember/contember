import { Logger } from '@contember/logger'
import { Actions } from '@contember/schema'
export interface InvokeHandler<Type extends Actions.AnyTarget> {
	handle(invocation: Type, events: EventRow[], logger: Logger): Promise<HandledEvent[]>
}
export declare type HandledEvent = {
	row: EventRow
	result: InvocationResult
	target?: Actions.AnyTarget
}
export declare type InvocationResult = {
	ok: boolean
	durationMs?: number
	errorMessage?: string
	code?: number
	response?: string
}
export declare type EventRow = {
	id: string
	transaction_id: string
	created_at: Date
	resolved_at: Date | null
	visible_at: Date
	num_retries: number
	state: 'created' | 'retrying' | 'processing' | 'succeed' | 'failed' | 'stopped'
	last_state_change: Date
	stage_id: number
	schema_id: string
	target: string
	payload: any
	log: any[]
}
//# sourceMappingURL=types.d.ts.map
