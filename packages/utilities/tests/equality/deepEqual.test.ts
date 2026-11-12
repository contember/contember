import { describe, expect, test } from 'bun:test'
import { deepEqual } from '../../src/index.js'

class Point {
	constructor(public x: number, public y: number) {}
}

describe('deepEqual', () => {
	test.each<[string, unknown, unknown]>([
		['same primitive', 1, 1],
		['NaN', Number.NaN, Number.NaN],
		['null', null, null],
		['nested objects regardless of key order', { a: 1, b: { c: [1, { d: 'x' }] } }, { b: { c: [1, { d: 'x' }] }, a: 1 }],
		['empty containers', { a: [], b: {} }, { a: [], b: {} }],
		['dates', new Date(1000), new Date(1000)],
		['regexps', /a+/gi, /a+/gi],
		['maps', new Map<string, unknown>([['a', { x: 1 }]]), new Map<string, unknown>([['a', { x: 1 }]])],
		['sets', new Set([1, 'a']), new Set(['a', 1])],
		['typed arrays', new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3])],
		['float arrays compare element-wise, 0 equals -0', new Float64Array([0]), new Float64Array([-0])],
		['data views', new DataView(new Uint8Array([1, 2]).buffer), new DataView(new Uint8Array([1, 2]).buffer)],
		['class instances', new Point(1, 2), new Point(1, 2)],
	])('equal: %s', (_, a, b) => {
		expect(deepEqual(a, b)).toBe(true)
		expect(deepEqual(b, a)).toBe(true)
	})

	test.each<[string, unknown, unknown]>([
		['different primitives', 1, 2],
		['number vs string', 1, '1'],
		['null vs object', null, {}],
		['undefined vs null', undefined, null],
		['0 vs NaN', 0, Number.NaN],
		['array vs object with index keys', [1], { 0: 1 }],
		['arrays of different length', [1, 2], [1, 2, 3]],
		['missing key', { a: 1, b: undefined }, { a: 1, c: undefined }],
		['extra key', { a: 1 }, { a: 1, b: 2 }],
		['nested difference', { a: { b: [1, 2] } }, { a: { b: [1, 3] } }],
		['dates', new Date(1000), new Date(2000)],
		['regexp flags', /a/g, /a/i],
		['regexp source', /a/, /b/],
		['map values', new Map([['a', 1]]), new Map([['a', 2]])],
		['map keys', new Map([['a', 1]]), new Map([['b', 1]])],
		['sets', new Set([1]), new Set([2])],
		['typed arrays', new Uint8Array([1, 2]), new Uint8Array([1, 3])],
		['float arrays compare element-wise, NaN is not NaN', new Float64Array([Number.NaN]), new Float64Array([Number.NaN])],
		['typed arrays of different length', new Uint8Array([1]), new Uint8Array([1, 0])],
		['data views', new DataView(new Uint8Array([1, 2]).buffer), new DataView(new Uint8Array([1, 3]).buffer)],
		['different constructors', new Point(1, 2), { x: 1, y: 2 }],
		['object vs Map', {}, new Map()],
	])('not equal: %s', (_, a, b) => {
		expect(deepEqual(a, b)).toBe(false)
		expect(deepEqual(b, a)).toBe(false)
	})
})
