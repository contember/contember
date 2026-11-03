import { describe, expect, it } from 'vitest'
import { emptyDatabaseMetadata, QueryError } from '@contember/database'
import { createLogger, TestLoggerHandler, withLogger } from '@contember/logger'
import { emptySchema } from '@contember/schema-utils'
import { convertError, MutationSqlError } from '../../../src/mapper'

const convert = (code: string, message: string) => {
	const error = new QueryError('select 1', [], Object.assign(new Error(message), { code }))
	const handler = new TestLoggerHandler()
	const result = withLogger(createLogger(handler), () => convertError(emptySchema.model, emptyDatabaseMetadata, error))
	if (!(result instanceof MutationSqlError)) {
		throw new Error('expected a MutationSqlError')
	}
	return { message: result.message, logged: handler.messages.map(it => it.error), error }
}

describe('mutation SQL error', () => {
	it('returns a generic message for an error that can quote internal identifiers, and logs the original', () => {
		const { message, logged, error } = convert('42702', 'column reference "root_$predicate_rule" is ambiguous')
		expect(message).toBe('Database query failed')
		expect(logged).toContain(error)
	})

	it('keeps the message of data, integrity and trigger errors', () => {
		expect(convert('23514', 'new row for relation "order" violates check constraint "order_total_check"').message)
			.toBe('new row for relation "order" violates check constraint "order_total_check"')
		expect(convert('22001', 'value too long for type character varying(10)').message).toBe('value too long for type character varying(10)')
		expect(convert('P0001', 'Order total must be positive').message).toBe('Order total must be positive')
	})
})
