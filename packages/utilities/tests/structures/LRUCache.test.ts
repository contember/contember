import { describe, expect, test } from 'bun:test'
import { LRUCache } from '../../src/index.js'

describe('LRUCache', () => {
	test('evicts the least recently used entry', () => {
		const cache = new LRUCache<string, number>(2)
		cache.set('a', 1)
		cache.set('b', 2)
		expect(cache.get('a')).toBe(1)
		cache.set('c', 3)
		expect(cache.get('b')).toBeUndefined()
		expect(cache.get('a')).toBe(1)
		expect(cache.get('c')).toBe(3)
	})

	test('overwriting a key does not evict another one', () => {
		const cache = new LRUCache<string, number>(2)
		cache.set('a', 1)
		cache.set('b', 2)
		cache.set('a', 10)
		expect(cache.get('a')).toBe(10)
		expect(cache.get('b')).toBe(2)
	})

	test('entries expire after ttl, reads do not extend them', () => {
		let now = 1000
		const cache = new LRUCache<string, number>(10, { ttl: 100, now: () => now })
		cache.set('a', 1)
		now = 1100
		expect(cache.get('a')).toBe(1)
		now = 1101
		expect(cache.get('a')).toBeUndefined()
		cache.set('a', 2)
		now = 1150
		expect(cache.get('a')).toBe(2)
	})

	test('purgeStale frees expired entries so they no longer take capacity', () => {
		let now = 0
		const cache = new LRUCache<string, number>(2, { ttl: 10, now: () => now })
		cache.set('old', 1)
		now = 5
		cache.set('fresh', 2)
		now = 11
		cache.purgeStale()
		cache.set('new', 3)
		expect(cache.get('fresh')).toBe(2)
		expect(cache.get('new')).toBe(3)
		expect(cache.get('old')).toBeUndefined()
	})

	test('without ttl entries never expire', () => {
		let now = 0
		const cache = new LRUCache<string, number>(1, { now: () => now })
		cache.set('a', 1)
		now = Number.MAX_SAFE_INTEGER
		expect(cache.get('a')).toBe(1)
	})
})
