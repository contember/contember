import { expect, test } from 'bun:test'
import { retryTransaction, SerializationFailureError } from '@contember/database'
import { InMemoryTriggeredActionsCollector, TriggeredActionEvent } from '@contember/engine-content-api'
import { createAttemptScopedTriggeredActionsCollector } from '../../../src/triggers/AttemptScopedTriggeredActionsCollector.js'

const createEvent = (id: string): TriggeredActionEvent => ({
	id,
	trigger: 'article_watch',
	target: 'article_watch_target',
	transactionId: `transaction-${id}`,
})

test('publishes only triggered action IDs from the successfully committed retry attempt', async () => {
	const requestCollector = new InMemoryTriggeredActionsCollector()
	requestCollector.add([createEvent('already-committed')])
	let attempts = 0

	const result = await retryTransaction(
		async () => {
			attempts++
			let publishAfterCommit = () => {}
			const attemptCollector = createAttemptScopedTriggeredActionsCollector(
				requestCollector,
				publish => publishAfterCommit = publish,
			)
			if (attemptCollector === undefined) {
				throw new Error('Expected an attempt collector')
			}
			const id = `attempt-${attempts}`
			attemptCollector.add([createEvent(id)])

			if (attempts === 1) {
				throw new SerializationFailureError('COMMIT', [], {
					message: 'could not serialize access due to concurrent update',
					code: '40001',
				})
			}

			publishAfterCommit()
			publishAfterCommit()
			return id
		},
		() => {},
		{ maxAttempts: 2, minTimeout: 0, maxTimeout: 0 },
	)

	expect(attempts).toBe(2)
	expect(result).toBe('attempt-2')
	const ids = requestCollector.getEvents().map(event => event.id)
	expect(ids).toEqual(['already-committed', 'attempt-2'])
	expect(new Set(ids).size).toBe(ids.length)
})

test('does not create an attempt collector when response action IDs are disabled', () => {
	let registered = false
	const collector = createAttemptScopedTriggeredActionsCollector(undefined, () => registered = true)
	expect(collector).toBeUndefined()
	expect(registered).toBeFalse()
})
