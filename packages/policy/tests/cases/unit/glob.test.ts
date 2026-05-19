import { describe, expect, test } from 'bun:test'
import { globMatch, globToRegExp } from '../../../src'

describe('glob matching', () => {
	test('exact match', () => {
		expect(globMatch('foo', 'foo')).toBe(true)
		expect(globMatch('foo', 'fooo')).toBe(false)
		expect(globMatch('foo', 'fo')).toBe(false)
	})

	test('* matches anything', () => {
		expect(globMatch('*', '')).toBe(true)
		expect(globMatch('*', 'anything')).toBe(true)
		expect(globMatch('*', 'with:colons/and/slashes')).toBe(true)
		expect(globMatch('tenant:*', 'tenant:project.create')).toBe(true)
		expect(globMatch('tenant:*', 'other:thing')).toBe(false)
	})

	test('* is greedy across colons', () => {
		expect(globMatch('project:*', 'project:webmaster/stage:dev')).toBe(true)
	})

	test('? matches one char', () => {
		expect(globMatch('a?c', 'abc')).toBe(true)
		expect(globMatch('a?c', 'a:c')).toBe(true)
		expect(globMatch('a?c', 'ac')).toBe(false)
		expect(globMatch('a?c', 'abbc')).toBe(false)
	})

	test('escapes regex specials in literal', () => {
		expect(globMatch('a.b', 'a.b')).toBe(true)
		expect(globMatch('a.b', 'axb')).toBe(false)
		expect(globMatch('a+b', 'a+b')).toBe(true)
		expect(globMatch('a(b)c', 'a(b)c')).toBe(true)
	})

	test('anchored', () => {
		expect(globMatch('foo', 'xfoox')).toBe(false)
		expect(globMatch('foo.*', 'foo.bar.baz')).toBe(true)
	})

	test('typical action patterns', () => {
		expect(globMatch('tenant:project.*', 'tenant:project.create')).toBe(true)
		expect(globMatch('tenant:project.*', 'tenant:idp.create')).toBe(false)
		expect(globMatch('tenant:*.create', 'tenant:project.create')).toBe(true)
		expect(globMatch('tenant:*.create', 'tenant:project.update')).toBe(false)
	})

	test('typical resource patterns', () => {
		expect(globMatch('project:webmaster', 'project:webmaster')).toBe(true)
		expect(globMatch('project:*', 'project:webmaster')).toBe(true)
		expect(globMatch('project:webmaster/stage:*', 'project:webmaster/stage:dev')).toBe(true)
		expect(globMatch('project:webmaster/stage:*', 'project:other/stage:dev')).toBe(false)
	})
})

describe('glob cache LRU', () => {
	test('cache reuses compiled regex for same pattern', () => {
		const a = globToRegExp('reuse-pattern:*')
		const b = globToRegExp('reuse-pattern:*')
		expect(a).toBe(b)
	})

	test('cache stays usable after exceeding the limit', () => {
		// Push enough distinct patterns to far exceed CACHE_LIMIT (1024) and
		// verify the cache still produces correct results — no crashes, no stale
		// regexes. The exact eviction order is internal.
		for (let i = 0; i < 1100; i++) {
			expect(globMatch(`unique-pattern-${i}:*`, `unique-pattern-${i}:thing`)).toBe(true)
		}
		// Re-using an early pattern: it may or may not still be cached, but the
		// behavior must be correct either way.
		expect(globMatch('unique-pattern-0:*', 'unique-pattern-0:other')).toBe(true)
		expect(globMatch('unique-pattern-0:*', 'mismatch')).toBe(false)
	})
})
