import { describe, expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { CheckViolationError, emptyDatabaseMetadata } from '@contember/database'
import { createLogger, LogEntry, LoggerHandler, withLogger } from '@contember/logger'
import { ConstraintType, convertError, MutationConstraintViolationError, MutationResult } from '../../../src/mapper/index.js'

namespace CheckModel {
	@c.Check({ name: 'price_non_negative', expression: 'price >= 0' })
	export class Product {
		price = c.intColumn()
	}
}

const model = createSchema(CheckModel).model

const createError = (fields: { table?: string; constraint?: string }) =>
	new CheckViolationError('INSERT ...', [], { code: '23514', message: 'new row violates check constraint', ...fields })

const convert = (error: CheckViolationError): { result: MutationResult; logs: LogEntry[] } => {
	const logs: LogEntry[] = []
	const handler: LoggerHandler = {
		getMinLevel: () => 0,
		handle: entry => logs.push(entry),
		close: () => {},
	}
	const result = withLogger(createLogger(handler), () => convertError(model, emptyDatabaseMetadata, error))
	return { result, logs }
}

describe('check violation error conversion', () => {
	test('names the schema check and entity without logging', () => {
		const { result, logs } = convert(createError({ table: 'product', constraint: 'price_non_negative' }))
		expect(result).toBeInstanceOf(MutationConstraintViolationError)
		expect(result).toMatchObject({
			constraint: ConstraintType.check,
			message: 'Check constraint "price_non_negative" on entity Product violated',
		})
		expect(logs).toEqual([])
	})

	test('falls back to the database message and warns for a check outside the schema (DOMAIN)', () => {
		const { result, logs } = convert(createError({ constraint: 'some_domain_check' }))
		expect(result).toMatchObject({
			constraint: ConstraintType.check,
			message: 'new row violates check constraint',
		})
		expect(logs.map(it => it.level.name)).toEqual(['warn'])
	})
})
