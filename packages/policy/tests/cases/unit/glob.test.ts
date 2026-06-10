import { describe, expect, test } from 'bun:test'
import { globMatch } from '../../../src/index.js'

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

describe('glob * and ? combined', () => {
	test('runs of mixed wildcards match correctly', () => {
		expect(globMatch('***a', 'xyza')).toBe(true)
		expect(globMatch('a***b', 'a-anything-b')).toBe(true)
		expect(globMatch('a***b', 'a-anything')).toBe(false)
		// `*?` means "at least one char"
		expect(globMatch('*?', '')).toBe(false)
		expect(globMatch('*?', 'a')).toBe(true)
		expect(globMatch('*?*', 'a')).toBe(true)
		expect(globMatch('a*?b', 'ab')).toBe(false)
		expect(globMatch('a*?b', 'axb')).toBe(true)
		expect(globMatch('a*?b', 'axyzb')).toBe(true)
	})

	test('* matches newlines (any character)', () => {
		expect(globMatch('a*b', 'a\nb')).toBe(true)
		expect(globMatch('a?b', 'a\nb')).toBe(true)
	})
})

describe('glob ReDoS resistance (no catastrophic backtracking)', () => {
	// The matcher is linear (two-pointer, no regex), so adversarial patterns
	// that made the old regex implementation backtrack exponentially must now
	// resolve promptly. Each of these would hang a `RegExp`-based matcher.
	test('long run of stars against long non-matching input resolves promptly', () => {
		const start = Date.now()
		expect(globMatch('*'.repeat(30) + 'x', 'y'.repeat(64))).toBe(false)
		expect(Date.now() - start).toBeLessThan(100)
	})

	test('* and ? interleaved (`*?*?…`) resolves promptly', () => {
		const start = Date.now()
		expect(globMatch('*?'.repeat(40) + 'x', 'y'.repeat(200))).toBe(false)
		expect(Date.now() - start).toBeLessThan(100)
	})

	test('stars separated by literals (`a*a*a*…`) resolves promptly', () => {
		const start = Date.now()
		expect(globMatch('a*'.repeat(40) + 'z', 'a'.repeat(200))).toBe(false)
		expect(Date.now() - start).toBeLessThan(100)
	})
})
