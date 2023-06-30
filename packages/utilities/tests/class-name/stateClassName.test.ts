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

		expect(stateClassName(classNameStateMap, { glue: '-' })).toEqual(['foo', 'baz-qux', 'quux-0', 'quuz-1', 'grault-garply', 'xyzzy-Infinity', 'thud--1'])
		expect(stateClassName(classNameStateMap, { glue: ':' })).toEqual(['foo', 'baz:qux', 'quux:0', 'quuz:1', 'grault:garply', 'xyzzy:Infinity', 'thud:-1'])
		expect(stateClassName(classNameStateMap, { glue: '__', removeFalsy: false })).toEqual([
			'foo',
			'bar__false',
			'baz__qux',
			'quux__0',
			'quuz__1',
			'corge__',
			'grault__garply',
			'waldo__null',
			'fred__undefined',
			'plugh__NaN',
			'xyzzy__Infinity',
			'thud__-1',
		])
	})
})
