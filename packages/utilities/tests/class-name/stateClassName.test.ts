import { describe, expect, test } from 'vitest'
import { stateClassName } from '../../src'

describe('@contember/utilities', function () {
	test('stateClassName', function () {
		let classNameStateMap = {
			'foo': true,
			'bar': false,
			'baz': 'qux',
			'quux': 0,
			'quuz': 1,
			'corge': '',
			'grault': 'garply',
			'waldo': null,
			'fred': undefined,
			'plugh': NaN,
			'xyzzy': Infinity,
			'thud': -1,
		}

		let glue = '-'
		let result = stateClassName(classNameStateMap, glue)

		expect(result).toEqual(['foo', 'baz-qux', 'quux-0', 'quuz-1', 'grault-garply', 'xyzzy-Infinity', 'thud--1'])
	})
})
