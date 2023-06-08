import { AnyEventPayload } from '../triggers/Payload'

export type EventRow = {
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
	trigger: string
	payload: AnyEventPayload
	log: any[]
}
