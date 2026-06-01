import { describe, it } from 'bun:test'
import { assert } from '../../src/assert'
import { validateJsonSchema } from '../../../src/input-validation/JsonSchemaValidator'

describe('JSON schema validator', () => {
	it('validates type', () => {
		assert.deepStrictEqual(validateJsonSchema({ type: 'string' }, 'hello'), [])
		assert.deepStrictEqual(validateJsonSchema({ type: 'string' }, 42), [
			{ path: '', message: 'Expected type string, got number' },
		])
		assert.deepStrictEqual(validateJsonSchema({ type: 'integer' }, 42), [])
		assert.deepStrictEqual(validateJsonSchema({ type: 'integer' }, 4.2), [
			{ path: '', message: 'Expected type integer, got number' },
		])
		assert.deepStrictEqual(validateJsonSchema({ type: ['string', 'null'] }, null), [])
	})

	it('validates enum and const', () => {
		assert.deepStrictEqual(validateJsonSchema({ enum: ['a', 'b'] }, 'a'), [])
		assert.deepStrictEqual(validateJsonSchema({ enum: ['a', 'b'] }, 'c'), [
			{ path: '', message: 'Value is not one of the allowed values' },
		])
		assert.deepStrictEqual(validateJsonSchema({ const: 5 }, 5), [])
		assert.deepStrictEqual(validateJsonSchema({ const: 5 }, 6), [
			{ path: '', message: 'Value does not match the expected constant' },
		])
	})

	it('validates string constraints', () => {
		assert.deepStrictEqual(validateJsonSchema({ type: 'string', minLength: 2, maxLength: 4 }, 'abc'), [])
		assert.deepStrictEqual(validateJsonSchema({ type: 'string', minLength: 5 }, 'abc'), [
			{ path: '', message: 'String is shorter than 5 characters' },
		])
		assert.deepStrictEqual(validateJsonSchema({ type: 'string', pattern: '^[a-z]+$' }, 'ABC'), [
			{ path: '', message: 'String does not match pattern ^[a-z]+$' },
		])
	})

	it('validates number constraints', () => {
		assert.deepStrictEqual(validateJsonSchema({ type: 'number', minimum: 0, maximum: 10 }, 5), [])
		assert.deepStrictEqual(validateJsonSchema({ type: 'number', minimum: 10 }, 5), [
			{ path: '', message: 'Value is less than minimum 10' },
		])
		assert.deepStrictEqual(validateJsonSchema({ type: 'number', multipleOf: 3 }, 7), [
			{ path: '', message: 'Value is not a multiple of 3' },
		])
	})

	it('validates objects with properties and required', () => {
		const schema = {
			type: 'object',
			properties: {
				name: { type: 'string' },
				age: { type: 'integer' },
			},
			required: ['name'],
			additionalProperties: false,
		}
		assert.deepStrictEqual(validateJsonSchema(schema, { name: 'Joe', age: 30 }), [])
		assert.deepStrictEqual(validateJsonSchema(schema, { age: 30 }), [
			{ path: '/name', message: 'Required property is missing' },
		])
		assert.deepStrictEqual(validateJsonSchema(schema, { name: 'Joe', extra: 1 }), [
			{ path: '/extra', message: 'Additional property is not allowed' },
		])
		assert.deepStrictEqual(validateJsonSchema(schema, { name: 5 }), [
			{ path: '/name', message: 'Expected type string, got number' },
		])
	})

	it('validates arrays', () => {
		const schema = { type: 'array', items: { type: 'number' }, minItems: 1, uniqueItems: true }
		assert.deepStrictEqual(validateJsonSchema(schema, [1, 2, 3]), [])
		assert.deepStrictEqual(validateJsonSchema(schema, []), [
			{ path: '', message: 'Array has fewer than 1 items' },
		])
		assert.deepStrictEqual(validateJsonSchema(schema, [1, 'x']), [
			{ path: '/1', message: 'Expected type number, got string' },
		])
		assert.deepStrictEqual(validateJsonSchema(schema, [1, 1]), [
			{ path: '', message: 'Array items are not unique' },
		])
	})

	it('validates nested structures with correct paths', () => {
		const schema = {
			type: 'object',
			properties: {
				tags: { type: 'array', items: { type: 'object', properties: { id: { type: 'integer' } }, required: ['id'] } },
			},
		}
		assert.deepStrictEqual(validateJsonSchema(schema, { tags: [{ id: 1 }, { id: 'x' }, {}] }), [
			{ path: '/tags/1/id', message: 'Expected type integer, got string' },
			{ path: '/tags/2/id', message: 'Required property is missing' },
		])
	})

	it('validates combinators', () => {
		assert.deepStrictEqual(validateJsonSchema({ anyOf: [{ type: 'string' }, { type: 'number' }] }, 5), [])
		assert.deepStrictEqual(validateJsonSchema({ anyOf: [{ type: 'string' }, { type: 'number' }] }, true), [
			{ path: '', message: 'Value does not match any of the allowed schemas' },
		])
		assert.deepStrictEqual(validateJsonSchema({ not: { type: 'string' } }, 5), [])
		assert.deepStrictEqual(validateJsonSchema({ not: { type: 'string' } }, 'x'), [
			{ path: '', message: 'Value matches a forbidden schema' },
		])
		assert.deepStrictEqual(validateJsonSchema({ oneOf: [{ type: 'number' }, { type: 'integer' }] }, 5), [
			{ path: '', message: 'Value must match exactly one of the allowed schemas' },
		])
	})

	it('ignores unknown keywords', () => {
		assert.deepStrictEqual(validateJsonSchema({ type: 'string', title: 'Foo', description: 'bar', format: 'email' }, 'x'), [])
	})
})
