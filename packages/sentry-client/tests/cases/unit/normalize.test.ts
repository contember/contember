import { describe, expect, test } from 'bun:test'
import { normalize, normalizeRecord, truncate } from '../../../src/normalize.js'

describe('normalize', () => {
	test('keeps plain data', () => {
		expect(normalize({ a: 1, b: 'x', c: [true, null], d: undefined }, 3, 1000)).toEqual({ a: 1, b: 'x', c: [true, null], d: undefined })
	})

	test('replaces objects below the depth limit by their constructor name', () => {
		class Row {
			id = 1
		}
		expect(normalize({ a: { b: { c: { d: 1 } }, row: new Row(), list: [[1]] } }, 3, 1000))
			.toEqual({ a: { b: { c: '[Object]' }, row: { id: 1 }, list: ['[Array]'] } })
		expect(normalize({ a: new Row() }, 1, 1000)).toEqual({ a: '[Row]' })
		expect(normalize({ a: Object.create(null) }, 1, 1000)).toEqual({ a: '[null prototype]' })
	})

	test('limits the number of properties', () => {
		expect(normalize({ a: 1, b: 2, c: 3 }, 3, 2)).toEqual({ a: 1, b: 2, c: '[MaxProperties ~]' })
		expect(normalize([1, 2, 3], 3, 2)).toEqual([1, 2, '[MaxProperties ~]'])
	})

	test('replaces values JSON cannot carry', () => {
		function named() {}
		expect(normalize({ nan: Number.NaN, fn: named, arrow: Reflect.get({ f: () => 1 }, 'f'), big: 10n, sym: Symbol('s'), global: globalThis }, 3, 1000))
			.toEqual({ nan: '[NaN]', fn: '[Function: named]', arrow: '[Function: f]', big: '[BigInt: 10]', sym: '[Symbol(s)]', global: '[Global]' })
	})

	test('breaks cycles, but not repeated references', () => {
		const shared = { x: 1 }
		const cyclic: Record<string, unknown> = { shared, again: shared }
		cyclic.self = cyclic
		expect(normalize(cyclic, 3, 1000)).toEqual({ shared: { x: 1 }, again: { x: 1 }, self: '[Circular ~]' })
	})

	test('uses toJSON', () => {
		expect(normalize({ at: new Date('2020-01-02T03:04:05.000Z'), custom: { toJSON: () => ({ v: 1 }) } }, 3, 1000))
			.toEqual({ at: '2020-01-02T03:04:05.000Z', custom: { v: 1 } })
	})

	test('serializes an error by its message, name, stack and own properties', () => {
		const error = Object.assign(new Error('boom'), { code: 'E1' })
		expect(normalize(error, 3, 1000)).toEqual({ message: 'boom', name: 'Error', stack: error.stack, code: 'E1' })
	})

	test('reports a value that throws while being read', () => {
		const hostile = {
			get value() {
				throw new Error('no')
			},
		}
		expect(normalize(hostile, 3, 1000)).toEqual({ ERROR: '**non-serializable** (Error: no)' })
	})
})

test('normalizeRecord keeps the result a record', () => {
	expect(normalizeRecord({ a: { b: 1 } }, 1, 1000)).toEqual({ a: '[Object]' })
	expect(normalizeRecord({ a: 1 }, 0, 1000)).toEqual({ value: '[Object]' })
})

test('truncate', () => {
	expect(truncate('abc', 3)).toBe('abc')
	expect(truncate('abcd', 3)).toBe('abc...')
})
