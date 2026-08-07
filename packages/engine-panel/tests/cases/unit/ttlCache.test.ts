import { describe, expect, test } from 'bun:test'
import { TtlCache } from '../../../src/TtlCache.js'

const clock = (start = 0) => {
	let now = start
	return { now: () => now, advance: (ms: number) => now += ms }
}

describe('ttl cache', () => {
	test('computes once within the ttl', async () => {
		let calls = 0
		const cache = new TtlCache<number>(1000, 1000, clock().now)
		const compute = async () => ++calls

		expect(await cache.resolve('a', compute)).toBe(1)
		expect(await cache.resolve('a', compute)).toBe(1)
		expect(calls).toBe(1)
	})

	test('recomputes after the ttl expires', async () => {
		let calls = 0
		const time = clock()
		const cache = new TtlCache<number>(1000, 1000, time.now)
		const compute = async () => ++calls

		await cache.resolve('a', compute)
		time.advance(1001)

		expect(await cache.resolve('a', compute)).toBe(2)
	})

	test('keeps keys apart', async () => {
		const cache = new TtlCache<string>(1000, 1000, clock().now)

		expect(await cache.resolve('a', async () => 'first')).toBe('first')
		expect(await cache.resolve('b', async () => 'second')).toBe('second')
		expect(await cache.resolve('a', async () => 'ignored')).toBe('first')
	})

	test('sweeps expired entries once it grows past the threshold', async () => {
		const time = clock()
		const cache = new TtlCache<number>(1000, 5, time.now)

		for (let i = 0; i < 4; i++) {
			await cache.resolve(`key-${i}`, async () => i)
		}
		expect(cache.size).toBe(4)

		time.advance(1001)
		// The fifth insert crosses the threshold, so the four stale entries go with it.
		await cache.resolve('fresh', async () => 99)

		expect(cache.size).toBe(1)
	})
})
