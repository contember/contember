import { ActionsPayload } from '@contember/schema'
import { EventRow } from '../../src/model/types.js'
import { testUuid } from './uuid.js'

export const testEventTime = new Date('2024-06-20T12:00:00Z')

export const createTestEvent = (i = 0, row: Partial<EventRow> = {}): EventRow => ({
	created_at: testEventTime,
	id: testUuid(i * 10 + 1),
	trigger: 'test',
	target: 'test_target',
	last_state_change: testEventTime,
	log: [],
	num_retries: 0,
	resolved_at: null,
	transaction_id: testUuid(i * 10 + 2),
	stage_id: testUuid(i * 10 + 3),
	visible_at: testEventTime,
	payload: { foo: 'bar' } as unknown as ActionsPayload.AnyEventPayload,
	priority: 1,
	schema_id: 1,
	state: 'created',
	identity_id: testUuid(i * 10 + 4),
	ip_address: '127.0.0.1',
	user_agent: 'test-agent',
	...row,
})
