import { Client } from '@contember/database'
import { Actions } from '@contember/schema'
import { InvocationResult } from './Invocation'
export declare type EventRow = {
	id: string
	transaction_id: string
	created_at: Date
	resolved_at: Date | null
	next_attempt_at: Date
	num_retries: number
	state: 'created' | 'retrying' | 'processing' | 'succeed' | 'failed' | 'stopped'
	last_state_change: Date
	stage_id: number
	schema_id: string
	trigger_name: string
	payload: any
	log: any[]
}
export declare type ProcessedEvent = {
	row: EventRow
	trigger: Actions.AnyTrigger
	result: InvocationResult
}
export declare class EventsManager {
	fetchForProcessing(db: Client, limit: number): Promise<EventRow[]>
	persistProcessed(db: Client, events: ProcessedEvent[]): Promise<void>
	private markSucceed
	private markFailed
}
//# sourceMappingURL=EventsManager.d.ts.map
