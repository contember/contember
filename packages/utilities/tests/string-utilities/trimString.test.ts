import { describe, expect, test } from 'vitest'
import { trimString } from '../../src'

describe('@contember/utilities', function () {
	test('@contember/utilities.trimString', function () {
		expect(trimString('this is test', 't')).equals('his is tes')
		expect(trimString('this this tests', 'thes')).equals('is this ')
	})
})
