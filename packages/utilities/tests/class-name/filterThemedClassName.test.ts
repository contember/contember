import { describe, expect, test } from 'vitest'
import { filterThemedClassName } from '../../src'

describe('@contember/react-utils', () => {
	test('useThemeClassName', () => {
		expect(filterThemedClassName('theme-primary-content', 'scheme-system')).toEqual([
			'scheme-system',
			'theme-primary-content',
		])

		expect(filterThemedClassName('theme-primary-controls', 'scheme-system')).toEqual([
			'scheme-system',
			'theme-primary-controls',
		])

		expect(filterThemedClassName('theme-danger', 'scheme-system')).toEqual([
			'scheme-system',
			'theme-danger-content',
			'theme-danger-controls',
		])

		expect(filterThemedClassName('theme-default theme-danger', 'scheme-system')).toEqual([
			'scheme-system',
			'theme-danger-content',
			'theme-danger-controls',
		])

		expect(filterThemedClassName('random-css-class', 'scheme-system')).toEqual([
			'random-css-class',
		])
	})
})
