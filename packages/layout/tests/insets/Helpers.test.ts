import { describe, expect, test } from 'vitest'
import { getElementInsets, screenInsetsToCSSCustomProperties } from '../../src'

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

	test('@contember/layout.getElementInsets', function () {
		const containerInsets = {
			'top': 113,
			'left': 0,
			'right': 60,
			'bottom': 76,
		}

		const containerOffsets = {
			'offsetTop': 129,
			'offsetLeft': 0,
			'offsetRight': 0,
			'offsetBottom': 447,
		}

		expect(getElementInsets(containerInsets, containerOffsets)).toEqual({
			'top': 0,
			'left': 0,
			'right': 60,
			'bottom': 0,
		})
	})
})
