import { describe, expect, test } from 'vitest'
import { screenInsetsToCSSCustomProperties } from '../../src'

describe('@contember/layout', function () {
	test('@contember/layout.screenInsetsToCSSCustomProperties', function () {
		expect(screenInsetsToCSSCustomProperties({
			'top': 10,
			'bottom': 20,
			'left': 30,
			'right': 40,
		}, '--inset-')).toEqual({
			'--inset-top': '10px',
			'--inset-bottom': '20px',
			'--inset-left': '30px',
			'--inset-right': '40px',
		})

		expect(screenInsetsToCSSCustomProperties({
			'top': 10,
			'bottom': null,
			'left': null,
			'right': null,
		}, '--inset-')).toEqual({
			'--inset-top': '10px',
		})

		expect(screenInsetsToCSSCustomProperties({
			'top': 10,
			'bottom': null,
			'left': null,
			'right': null,
		}, '--inset-')).toEqual({
			'--inset-top': '10px',
		})

		expect(screenInsetsToCSSCustomProperties({
			'top': 10,
			'bottom': 20,
			'left': null,
			'right': null,
		}, '--inset-')).toEqual({
			'--inset-top': '10px',
			'--inset-bottom': '20px',
		})

		expect(screenInsetsToCSSCustomProperties({
			'top': 10,
			'bottom': 20,
			'left': 30,
			'right': null,
		}, '--inset-')).toEqual({
			'--inset-top': '10px',
			'--inset-bottom': '20px',
			'--inset-left': '30px',
		})

		expect(screenInsetsToCSSCustomProperties({
			'top': 10,
			'bottom': 20,
			'left': null,
			'right': 40,
		}, '--inset-')).toEqual({
			'--inset-top': '10px',
			'--inset-bottom': '20px',
			'--inset-right': '40px',
		})
	})
})
