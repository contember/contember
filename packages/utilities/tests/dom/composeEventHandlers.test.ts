import { describe, expect, test } from 'bun:test'
import { composeEventHandlers } from '../../src/index.js'

type TestEvent = { defaultPrevented: boolean }

describe('composeEventHandlers', () => {
	test('calls the original handler first, then ours', () => {
		const calls: string[] = []
		const handler = composeEventHandlers<TestEvent>(() => calls.push('original'), () => calls.push('ours'))
		handler({ defaultPrevented: false })
		expect(calls).toEqual(['original', 'ours'])
	})

	test('skips our handler when the original one prevented the default', () => {
		const calls: string[] = []
		const handler = composeEventHandlers<TestEvent>(
			event => {
				event.defaultPrevented = true
			},
			() => calls.push('ours'),
		)
		handler({ defaultPrevented: false })
		expect(calls).toEqual([])
	})

	test('calls our handler on a prevented event when the check is off', () => {
		const calls: string[] = []
		const handler = composeEventHandlers<TestEvent>(undefined, () => calls.push('ours'), { checkForDefaultPrevented: false })
		handler({ defaultPrevented: true })
		expect(calls).toEqual(['ours'])
	})

	test('accepts missing handlers', () => {
		expect(() => composeEventHandlers<TestEvent>()({ defaultPrevented: false })).not.toThrow()
	})
})
