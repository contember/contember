import { describe, expect, test } from 'bun:test'
import { inspect as graphqlJsInspect } from 'graphql/jsutils/inspect.js'
import { inspect } from '../src/utils/helpers.js'

class Point {
	constructor(readonly x: number) {}
}

const circular: { self?: unknown } = {}
circular.self = circular

const values: Record<string, unknown> = {
	'string': 'a "quoted" value',
	'number': 1.5,
	'NaN': Number.NaN,
	'boolean': false,
	'null': null,
	'undefined': undefined,
	'symbol': Symbol('s'),
	'bigint': 10n,
	'named function': function named() {},
	'anonymous function': () => {},
	'empty object': {},
	'object with more than three keys': { a: 1, b: 'x', c: null, d: [1], e: { f: true } },
	'nested beyond max depth': { a: { b: { c: { d: 1 } } } },
	'class instance': new Point(1),
	'class instance beyond max depth': [[[new Point(1)]]],
	'null prototype object': Object.create(null),
	'empty array': [],
	'long array': Array.from({ length: 12 }, (_, i) => i),
	'array with one extra item': Array.from({ length: 11 }, (_, i) => i),
	'arrays beyond max depth': [[[[1]]]],
	'toJSON returning a string': new Date(0),
	'toJSON returning an object': { toJSON: () => ({ a: 1 }) },
	'circular': circular,
}

describe('inspect', () => {
	for (const [name, value] of Object.entries(values)) {
		test(`matches graphql-js for ${name}`, () => {
			expect(inspect(value)).toBe(graphqlJsInspect(value))
		})
	}
})
