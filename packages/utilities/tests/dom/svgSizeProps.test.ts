import { describe, expect, test } from 'vitest'
import { svgSizeProps } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.svgViewBox', function () {
		expect(svgSizeProps(100)).toEqual({
			width: 100,
			height: 100,
			viewBox: '0 0 100 100',
		})
		expect(svgSizeProps(100, 100)).toEqual({
			width: 100,
			height: 100,
			viewBox: '0 0 100 100',
		})
		expect(svgSizeProps(70, 70, 10)).toEqual({
			width: 50,
			height: 50,
			viewBox: '10 10 50 50',
		})
	})
})
