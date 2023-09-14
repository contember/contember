import { describe, expect, test } from 'vitest'
import { COLOR_SCHEME_CLASS_NAME_REG_EXP, THEME_CLASS_NAME_REG_EXP } from '../../src'

describe('@contember/utilities', () => {
	test('THEME_CLASS_NAME_REG_EXP', () => {
		expect('theme-foo'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo',
			scope: undefined,
		})
		expect('theme-foo'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo',
			scope: undefined,
		})
		expect('theme-foo-content'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo',
			scope: 'content',
		})

		expect('theme-foo-bar-content'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo-bar',
			scope: 'content',
		})

		expect('theme-foo-bar-content'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo-bar',
			scope: 'content',
		})

		expect('theme-foo-bar-baz-controls'.match(THEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			name: 'foo-bar-baz',
			scope: 'controls',
		})

		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-content')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-default-controls')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-content')).toBe(true)
		expect(THEME_CLASS_NAME_REG_EXP.test('theme-brand-color-controls')).toBe(true)
	})

	test('SCHEME_CLASS_NAME_REG_EXP', () => {
		expect('scheme-'.match(COLOR_SCHEME_CLASS_NAME_REG_EXP)?.groups).toEqual(undefined)
		expect('scheme-a-'.match(COLOR_SCHEME_CLASS_NAME_REG_EXP)?.groups).toEqual(undefined)
		expect('scheme-foo'.match(COLOR_SCHEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			colorScheme: 'foo',
		})
		expect('scheme-foo-bar'.match(COLOR_SCHEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			colorScheme: 'foo-bar',
		})
		expect('scheme-foo-bar-baz'.match(COLOR_SCHEME_CLASS_NAME_REG_EXP)?.groups).toEqual({
			colorScheme: 'foo-bar-baz',
		})
	})
})
