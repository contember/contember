import { renderHook } from '@testing-library/react-hooks'
import { describe, expect, test } from 'vitest'
import { useClassName } from '../../src'

describe('@contember/utilities', () => {
	test('useClassName', () => {
		expect(renderHook(() => useClassName('foo')).result.current).toBe('cui-foo')
		expect(renderHook(() => useClassName('foo', 'bar-baz')).result.current).toBe('cui-foo bar-baz')
		expect(renderHook(() => useClassName('foo', ['bar', null, undefined, false, 'baz', ''])).result.current).toBe('cui-foo bar baz')

		expect(renderHook(() => useClassName('foo xyz')).result.current).toBe('cui-foo cui-xyz')
		expect(renderHook(() => useClassName('foo xyz', 'bar-baz')).result.current).toBe('cui-foo cui-xyz bar-baz')
		expect(renderHook(() => useClassName('foo xyz', ['bar', null, undefined, false, 'baz', ''])).result.current).toBe('cui-foo cui-xyz bar baz')
	})
})
