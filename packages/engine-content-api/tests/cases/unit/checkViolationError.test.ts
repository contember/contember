import { describe, expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { CheckViolationError, emptyDatabaseMetadata } from '@contember/database'
import { ConstraintType, convertError, MutationConstraintViolationError } from '../../../src/mapper/index.js'

namespace CheckModel {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn()
	}
}

const model = createSchema(CheckModel).model

const createError = (fields: { table?: string; constraint?: string }) =>
	new CheckViolationError('INSERT ...', [], { code: '23514', message: 'new row violates check constraint', ...fields })

describe('check violation error conversion', () => {
	test('names the schema check and entity', () => {
		const result = convertError(model, emptyDatabaseMetadata, createError({ table: 'product', constraint: 'price_non_negative' }))
		expect(result).toBeInstanceOf(MutationConstraintViolationError)
		expect(result).toMatchObject({
			constraint: ConstraintType.check,
			message: 'Check constraint "price_non_negative" on entity Product violated',
		})
	})

	test('falls back to the database message for a check outside the schema (enum domain)', () => {
		const result = convertError(model, emptyDatabaseMetadata, createError({ constraint: 'some_enum_check' }))
		expect(result).toMatchObject({
			constraint: ConstraintType.check,
			message: 'new row violates check constraint',
		})
	})
})
