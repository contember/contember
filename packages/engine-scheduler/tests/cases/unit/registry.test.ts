import { describe, expect, test } from 'bun:test'
import { ScheduledJobRegistry } from '../../../src/registry/ScheduledJobRegistry.js'

describe('ScheduledJobRegistry', () => {
	test('registers and lists jobs', () => {
		const registry = new ScheduledJobRegistry()
		const a = { name: 'a', run: async () => {} }
		const b = { name: 'b', schedule: { everyMinutes: 5 }, run: async () => {} }
		registry.register(a)
		registry.register(b)

		expect(registry.list()).toEqual([a, b])
		expect(registry.has('a')).toBe(true)
		expect(registry.has('missing')).toBe(false)
	})

	test('rejects duplicate job names', () => {
		const registry = new ScheduledJobRegistry()
		registry.register({ name: 'dup', run: async () => {} })
		expect(() => registry.register({ name: 'dup', run: async () => {} })).toThrow()
	})

	test('a registered no-op job can be ticked', async () => {
		const registry = new ScheduledJobRegistry()
		let ticked = 0
		const job = { name: 'noop', run: async () => { ticked++ } }
		registry.register(job)

		// The scheduler loop would iterate list() and invoke each job's run under a lock.
		expect(registry.list()).toContain(job)
		await job.run()
		expect(ticked).toBe(1)
	})
})
