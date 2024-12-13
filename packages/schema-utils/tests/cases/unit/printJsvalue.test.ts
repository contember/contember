import { beforeAll, describe, expect, test } from 'bun:test'
import { printJsValue } from '../../../src/utils/printJsValue'

describe('printJsValue', () => {
	test('string', () => {
		expect(printJsValue('foobar')).toEqual(`'foobar'`)
	})

	test('string escape', () => {
		expect(printJsValue('foo\'bar')).toEqual(`'foo\\'bar'`)
	})

	test('number', () => {
		expect(printJsValue(11)).toEqual(`11`)
	})

	test('boolean', () => {
		expect(printJsValue(true)).toEqual(`true`)
	})

	test('null', () => {
		expect(printJsValue(null)).toEqual(`null`)
	})

	test('inline array', () => {
		expect(printJsValue([1, 2, 3])).toEqual(`[1, 2, 3]`)
	})
	test('block array', () => {
		expect(printJsValue([1, 2, 3], () => true)).toEqual(
			`[
	1,
	2,
	3,
]`)
	})

	test('inline object', () => {
		expect(printJsValue({ a: 1, b: 2 })).toEqual('{ a: 1, b: 2 }')
	})

	test('block object', () => {
		expect(printJsValue({ a: 1, b: 2 }, () => true)).toEqual(
			`{
	a: 1,
	b: 2,
}`)
	})

	test('nested block object', () => {
		expect(printJsValue({ a: 1, b: { c: { d: { e: 1 } } } }, () => true)).toEqual(
			`{
	a: 1,
	b: {
		c: {
			d: {
				e: 1,
			},
		},
	},
}`)
	})


	test('one level nested block object', () => {
		expect(printJsValue({ a: 1, b: { c: { d: { e: 1 } } } }, (_, path) => path.length === 0)).toEqual(
			`{
	a: 1,
	b: { c: { d: { e: 1 } } },
}`)
	})

	test('nested block object and arr', () => {
		expect(printJsValue({ a: 1, b: [2, { c: 4 }, [5, 6]] }, () => true)).toEqual(
			`{
	a: 1,
	b: [
		2,
		{
			c: 4,
		},
		[
			5,
			6,
		],
	],
}`)
	})
})
