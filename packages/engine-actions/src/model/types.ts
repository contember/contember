import { ActionsPayload } from '@contember/schema'

export type EventRow = {
	id: string
	transaction_id: string
	created_at: Date
	resolved_at: Date | null
	visible_at: Date
	num_retries: number
	state: 'created' | 'retrying' | 'processing' | 'succeed' | 'failed' | 'stopped'
	last_state_change: Date
	stage_id: string
	schema_id: number
	target: string
	priority: number
	trigger: string
	identity_id: string | null
	ip_address: string | null
	user_agent: string | null
	payload: ActionsPayload.AnyEventPayload
	log: any[]
}
