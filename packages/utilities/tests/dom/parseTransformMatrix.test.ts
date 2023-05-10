import { describe, expect, test } from 'vitest'
import { parseTransformMatrix } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.parseTransformMatrix', function () {
		expect(JSON.stringify(parseTransformMatrix('matrix(1, 2, 3, 4, 5, 6)'))).equals(JSON.stringify({
			scaleX: 1,
			skewY: 2,
			skewX: 3,
			scaleY: 4,
			translateX: 5,
			translateY: 6,
		}))

		expect(() => parseTransformMatrix('matrix(1, 2, 3, 4, 5)')).throws('transform matrix is tuple of six numbers')

		expect(parseTransformMatrix('other')).equals(undefined)
	})
})
