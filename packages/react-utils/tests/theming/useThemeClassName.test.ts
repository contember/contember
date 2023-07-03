import { renderHook } from '@testing-library/react-hooks'
import { describe, expect, test } from 'vitest'
import { THEME_CLASS_NAME_REG_EXP, useThemedClassName } from '../../src'

describe('@contember/utilities', () => {
	test('THEME_CLASS_NAME_REG_EXP', () => {
		expect('theme-foo'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo',
			scope: undefined,
			state: undefined,
		})
		expect('theme-foo:focus'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo',
			scope: undefined,
			state: ':focus',
		})
		expect('theme-foo-content:focus'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo',
			scope: 'content',
			state: ':focus',
		})

		expect('theme-foo-bar-content:active'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo-bar',
			scope: 'content',
			state: ':active',
		})

		expect('theme-foo-bar-content:hover'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo-bar',
			scope: 'content',
			state: ':hover',
		})

		expect('theme-foo-bar-baz-controls:focus-visible'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo-bar-baz',
			scope: 'controls',
			state: ':focus-visible',
		})

		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default:hover')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default:active')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default:focus')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-content')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-content:hover')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-content:active')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-content:focus')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-controls')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-controls:hover')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-controls:active')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-controls:focus')).toBe(true)

		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color:hover')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color:active')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color:focus')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-content')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-content:hover')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-content:active')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-content:focus')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-controls')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-controls:hover')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-controls:active')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-controls:focus')).toBe(true)
	})


	test('useThemeClassName', () => {
		expect(renderHook(() => useThemedClassName('theme-primary-content')).result.current).toEqual([
			'scheme-system',
			'theme-primary-content',
		])

		expect(renderHook(() => useThemedClassName('theme-primary-controls')).result.current).toEqual([
			'scheme-system',
			'theme-primary-controls',
		])

		expect(renderHook(() => useThemedClassName('theme-danger')).result.current).toEqual([
			'scheme-system',
			'theme-danger-content',
			'theme-danger-controls',
		])

		expect(renderHook(() => useThemedClassName('theme-default theme-danger:hover')).result.current).toEqual([
			'scheme-system',
			'theme-default-content',
			'theme-default-controls',
			'theme-danger-content:hover',
			'theme-danger-controls:hover',
		])
	})
})
