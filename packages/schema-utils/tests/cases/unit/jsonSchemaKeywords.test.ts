import { describe, expect, test } from 'bun:test'
import { collectUnsupportedJsonSchemaKeywords } from '../../../src'

describe('collectUnsupportedJsonSchemaKeywords', () => {
	test('accepts a fully supported schema', () => {
		expect(collectUnsupportedJsonSchemaKeywords({
			type: 'object',
			properties: {
				name: { type: 'string', minLength: 1, maxLength: 10, pattern: '^.+$' },
				age: { type: 'integer', minimum: 0, maximum: 120 },
				tags: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5, uniqueItems: true },
				kind: { enum: ['a', 'b'] },
				flag: { const: true },
			},
			required: ['name'],
			additionalProperties: false,
			minProperties: 1,
			maxProperties: 10,
		})).toStrictEqual([])
	})

	test('accepts combinators', () => {
		expect(collectUnsupportedJsonSchemaKeywords({
			allOf: [{ type: 'object' }],
			anyOf: [{ type: 'string' }, { type: 'number' }],
			oneOf: [{ const: 1 }, { const: 2 }],
			not: { type: 'null' },
		})).toStrictEqual([])
	})

	test('accepts annotation keywords', () => {
		expect(collectUnsupportedJsonSchemaKeywords({
			$schema: 'https://json-schema.org/draft/2020-12/schema',
			$id: 'https://example.com/x',
			$comment: 'note',
			title: 'Title',
			description: 'Desc',
			examples: [1, 2],
			default: 0,
			readOnly: true,
			writeOnly: false,
			deprecated: false,
			type: 'integer',
		})).toStrictEqual([])
	})

	test.each([
		'$ref',
		'$defs',
		'format',
		'patternProperties',
		'propertyNames',
		'dependentRequired',
		'dependentSchemas',
		'if',
		'then',
		'else',
		'contains',
		'prefixItems',
	])('rejects unsupported keyword %s at the root', keyword => {
		expect(collectUnsupportedJsonSchemaKeywords({ [keyword]: {} })).toStrictEqual([{ keyword, path: '' }])
	})

	test('descends into properties, items, additionalProperties and reports a path', () => {
		expect(collectUnsupportedJsonSchemaKeywords({
			type: 'object',
			properties: {
				a: { type: 'string', format: 'email' },
			},
			additionalProperties: { type: 'array', items: { contains: { type: 'number' } } },
		})).toStrictEqual([
			{ keyword: 'format', path: '/properties/a' },
			{ keyword: 'contains', path: '/additionalProperties/items' },
		])
	})

	test('descends into combinators', () => {
		expect(collectUnsupportedJsonSchemaKeywords({
			anyOf: [{ type: 'string' }, { type: 'object', propertyNames: { pattern: '^x' } }],
			not: { $ref: '#/x' },
		})).toStrictEqual([
			{ keyword: 'propertyNames', path: '/anyOf/1' },
			{ keyword: '$ref', path: '/not' },
		])
	})

	test('boolean schema is valid', () => {
		expect(collectUnsupportedJsonSchemaKeywords(true)).toStrictEqual([])
		expect(collectUnsupportedJsonSchemaKeywords(false)).toStrictEqual([])
	})
})
