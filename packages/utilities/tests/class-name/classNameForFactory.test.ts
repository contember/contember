import { describe, expect, test } from 'vitest'
import { classNameForFactory } from '../../src'

describe('@contember/utilities', function () {
	test('classNameForFactory', function () {
		const classNameFor = classNameForFactory('componentClassName', 'className', { 'state': true })
		expect(classNameFor()).equals('componentClassName className state')
		expect(classNameFor('suffix')).equals('componentClassName-suffix state')
		expect(classNameFor(null, 'additionalClassName')).equals('componentClassName className state additionalClassName')
		expect(classNameFor('suffix', 'additionalClassName')).equals('componentClassName-suffix state additionalClassName')
	})
})
