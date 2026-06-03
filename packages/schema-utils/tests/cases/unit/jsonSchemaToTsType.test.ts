import { describe, expect, test } from 'bun:test'
import { jsonSchemaToTsType } from '../../../src'

describe('jsonSchemaToTsType', () => {
	test('scalars', () => {
		expect(jsonSchemaToTsType({ type: 'string' })).toBe('string')
		expect(jsonSchemaToTsType({ type: 'integer' })).toBe('number')
		expect(jsonSchemaToTsType({ type: 'number' })).toBe('number')
		expect(jsonSchemaToTsType({ type: 'boolean' })).toBe('boolean')
		expect(jsonSchemaToTsType({ type: 'null' })).toBe('null')
	})

	test('type union', () => {
		expect(jsonSchemaToTsType({ type: ['string', 'null'] })).toBe('string | null')
	})

	test('const and enum', () => {
		expect(jsonSchemaToTsType({ const: 'x' })).toBe('"x"')
		expect(jsonSchemaToTsType({ const: 5 })).toBe('5')
		expect(jsonSchemaToTsType({ enum: ['a', 'b', 1] })).toBe('"a" | "b" | 1')
	})

	test('object with required and optional properties', () => {
		expect(jsonSchemaToTsType({
			type: 'object',
			properties: {
				name: { type: 'string' },
				age: { type: 'integer' },
			},
			required: ['name'],
		})).toBe('{ name: string; age?: number }')
	})

	test('array of strings', () => {
		expect(jsonSchemaToTsType({ type: 'array', items: { type: 'string' } })).toBe('readonly (string)[]')
	})

	test('combinators', () => {
		expect(jsonSchemaToTsType({ anyOf: [{ type: 'string' }, { type: 'number' }] })).toBe('string | number')
		expect(jsonSchemaToTsType({ allOf: [{ type: 'object', properties: { a: { type: 'string' } }, required: ['a'] }] }))
			.toBe('{ a: string }')
	})

	test('falls back to JSONValue for unexpressible constructs', () => {
		expect(jsonSchemaToTsType({})).toBe('JSONValue')
		expect(jsonSchemaToTsType(true)).toBe('JSONValue')
		expect(jsonSchemaToTsType({ not: { type: 'string' } })).toBe('JSONValue')
		// object with no declared properties stays JSONValue rather than emitting `{}`
		expect(jsonSchemaToTsType({ type: 'object' })).toBe('JSONValue')
		// const of a non-primitive
		expect(jsonSchemaToTsType({ const: { a: 1 } })).toBe('JSONValue')
		// unsupported nested item type degrades to JSONValue element rather than failing whole array
		expect(jsonSchemaToTsType({ type: 'array', items: { not: {} } })).toBe('readonly (JSONValue)[]')
	})
})
