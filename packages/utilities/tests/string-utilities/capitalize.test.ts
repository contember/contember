import { describe, expect, test } from 'vitest'
import { capitalize } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.capitalize', function () {
		expect(capitalize('test')).equals('Test')
	})
})
