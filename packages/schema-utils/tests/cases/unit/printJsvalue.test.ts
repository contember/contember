import { beforeAll, describe, expect, test } from 'vitest'
import { printJsValue } from '../../../src/utils/printJsValue'

beforeAll(() => {
	expect.addSnapshotSerializer({
		test: val => typeof val === 'string',
		print: val => String(val),
	})
})

describe('printJsValue', () => {
	test('string', () => {
		expect(printJsValue('foobar')).toMatchInlineSnapshot(`'foobar'`)
	})

	test('string escape', () => {
		expect(printJsValue('foo\'bar')).toMatchInlineSnapshot(`'foo\\'bar'`)
	})

	test('number', () => {
		expect(printJsValue(11)).toMatchInlineSnapshot(`11`)
	})

	test('boolean', () => {
		expect(printJsValue(true)).toMatchInlineSnapshot(`true`)
	})

	test('null', () => {
		expect(printJsValue(null)).toMatchInlineSnapshot(`null`)
	})

	test('inline array', () => {
		expect(printJsValue([1, 2, 3])).toMatchInlineSnapshot(`[1, 2, 3]`)
	})
	test('block array', () => {
		expect(printJsValue([1, 2, 3], () => true)).toMatchInlineSnapshot(`
			[
				1,
				2,
				3,
			]
		`)
	})

	test('inline object', () => {
		expect(printJsValue({ a: 1, b: 2 })).toMatchInlineSnapshot('{ a: 1, b: 2 }')
	})

	test('block object', () => {
		expect(printJsValue({ a: 1, b: 2 }, () => true)).toMatchInlineSnapshot(`
			{
				a: 1,
				b: 2,
			}
		`)
	})

	test('nested block object', () => {
		expect(printJsValue({ a: 1, b: { c: { d: { e: 1 } } } }, () => true)).toMatchInlineSnapshot(`
			{
				a: 1,
				b: {
					c: {
						d: {
							e: 1,
						},
					},
				},
			}
		`)
	})


	test('one level nested block object', () => {
		expect(printJsValue({ a: 1, b: { c: { d: { e: 1 } } } }, (_, path) => path.length === 0)).toMatchInlineSnapshot(`
			{
				a: 1,
				b: { c: { d: { e: 1 } } },
			}
		`)
	})

	test('nested block object and arr', () => {
		expect(printJsValue({ a: 1, b: [2, { c: 4 }, [5, 6]] }, () => true)).toMatchInlineSnapshot(`
			{
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
			}
		`)
	})
})
