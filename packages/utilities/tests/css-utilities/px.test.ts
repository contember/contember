import { describe, expect, test } from 'vitest'
import { px } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.px', function () {
		expect(px(100)).equals('100px')
		expect(px(false)).equals('')
		expect(px(null)).equals('')
		expect(px(undefined)).equals('')
		expect(px(NaN)).equals('')
	})
})
