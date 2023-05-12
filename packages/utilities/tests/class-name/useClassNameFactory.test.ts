import { renderHook } from '@testing-library/react-hooks'
import { describe, expect, test } from 'vitest'
import { useClassNameFactory } from '../../src'

describe('@contember/utilities', () => {
	test('useClassNameFactory', () => {
		const componentClassName = renderHook(() => useClassNameFactory('foo')).result.current

		expect(componentClassName()).toBe('cui-foo')
		expect(componentClassName('')).toBe('cui-foo')
		expect(componentClassName(null)).toBe('cui-foo')
		expect(componentClassName(undefined)).toBe('cui-foo')

		expect(componentClassName('suffix')).toBe('cui-foo-suffix')
		expect(componentClassName('__suffix')).toBe('cui-foo__suffix')
		expect(componentClassName('--suffix')).toBe('cui-foo--suffix')
	})

	test('useClassNameFactory with glue', () => {
		const componentClassName = renderHook(() => useClassNameFactory('foo', '--')).result.current

		expect(componentClassName('suffix')).toBe('cui-foo--suffix')
		expect(componentClassName('__suffix')).toBe('cui-foo__suffix')
		expect(componentClassName('-suffix')).toBe('cui-foo-suffix')
	})

	test('useClassNameFactory with prefix override', () => {
		const componentClassName = renderHook(() => useClassNameFactory('foo', undefined, 'bar-')).result.current

		expect(componentClassName()).toBe('bar-foo')
		expect(componentClassName('suffix')).toBe('bar-foo-suffix')
		expect(componentClassName('__suffix')).toBe('bar-foo__suffix')
		expect(componentClassName('--suffix')).toBe('bar-foo--suffix')
	})

	test('useClassNameFactory without prefix override', () => {
		const componentClassName = renderHook(() => useClassNameFactory('foo', undefined, null)).result.current

		expect(componentClassName()).toBe('foo')
		expect(componentClassName('suffix')).toBe('foo-suffix')
		expect(componentClassName('__suffix')).toBe('foo__suffix')
		expect(componentClassName('--suffix')).toBe('foo--suffix')
	})

	test('useClassNameFactory with multiple input class names', () => {
		const componentClassName = renderHook(() => useClassNameFactory(['foo', 'bar'])).result.current

		expect(componentClassName()).toBe('cui-foo cui-bar')
		expect(componentClassName('suffix')).toBe('cui-foo-suffix cui-bar-suffix')
		expect(componentClassName('__suffix')).toBe('cui-foo__suffix cui-bar__suffix')
		expect(componentClassName('--suffix')).toBe('cui-foo--suffix cui-bar--suffix')
	})
})
