import { expect, test } from 'bun:test'
import { ContentApiSpecificCache } from '../../../src/content/ContentApiSpecificCache.js'

const notCalled = (): never => {
	throw new Error('value should be cached')
}

test('maxEntries evicts the least recently used entry', () => {
	const objectKey = {}
	const cache = new ContentApiSpecificCache<object, string>({ maxEntries: 2 })
	cache.fetch(objectKey, 'a', () => 'a1')
	cache.fetch(objectKey, 'b', () => 'b1')
	expect(cache.fetch(objectKey, 'a', notCalled)).toBe('a1')

	cache.fetch(objectKey, 'c', () => 'c1')

	expect(cache.fetch(objectKey, 'a', notCalled)).toBe('a1')
	expect(cache.fetch(objectKey, 'c', notCalled)).toBe('c1')
	expect(cache.fetch(objectKey, 'b', () => 'b2')).toBe('b2')
})

test('maxEntries counts entries of all object keys together', () => {
	const first = {}
	const second = {}
	const cache = new ContentApiSpecificCache<object, string>({ maxEntries: 1 })
	cache.fetch(first, 'a', () => 'first')
	cache.fetch(second, 'a', () => 'second')

	expect(cache.fetch(second, 'a', notCalled)).toBe('second')
	expect(cache.fetch(first, 'a', () => 'first again')).toBe('first again')
})

test('without maxEntries nothing is evicted', () => {
	const objectKey = {}
	const cache = new ContentApiSpecificCache<object, number>({})
	for (let i = 0; i < 1000; i++) {
		cache.fetch(objectKey, String(i), () => i)
	}

	expect(cache.fetch(objectKey, '0', notCalled)).toBe(0)
})

test('without maxEntries the recency order stays empty, so entries of collected object keys leave nothing behind', () => {
	const cache = new ContentApiSpecificCache<object, number>({ ttlSeconds: 60 })
	for (let i = 0; i < 100; i++) {
		cache.fetch({}, 'a', () => i)
	}

	expect(cache['recency'].size).toBe(0)
})

test('an entry expired by ttl frees its slot', async () => {
	const objectKey = {}
	const cache = new ContentApiSpecificCache<object, string>({ maxEntries: 2, ttlSeconds: 0.05 })
	cache.fetch(objectKey, 'a', () => 'a1')
	await new Promise(resolve => setTimeout(resolve, 100))
	cache.fetch(objectKey, 'b', () => 'b1')
	cache.fetch(objectKey, 'c', () => 'c1')

	expect(cache.fetch(objectKey, 'b', notCalled)).toBe('b1')
	expect(cache.fetch(objectKey, 'c', notCalled)).toBe('c1')
	expect(cache.fetch(objectKey, 'a', () => 'a2')).toBe('a2')
})
