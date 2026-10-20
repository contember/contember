import { describe, expect, test } from 'bun:test'
import { ClientErrorCodes, QueryError } from '@contember/database'
import { createLogger, TestLoggerHandler, withLogger } from '@contember/logger'
import { InvalidSchemaError, MigrationError, MigrationFailedError } from '../../../src/model/index.js'
import { createMigrationErrorResponse } from '../../../src/resolvers/mutation/MigrateMutationResolver.js'
import { MigrateErrorCode } from '../../../src/schema/index.js'

const respond = (error: MigrationError) => {
	const handler = new TestLoggerHandler()
	const response = withLogger(createLogger(handler), () => createMigrationErrorResponse(error))
	return { response, logLevels: handler.messages.map(it => it.level.name) }
}

describe('migration error response', () => {
	test('logs a failed SQL statement once, also a lock conflict that no retry recovered', () => {
		for (const code of [ClientErrorCodes.LOCK_NOT_AVAILABLE, ClientErrorCodes.UNIQUE_VIOLATION]) {
			const queryError = new QueryError('ALTER TABLE "author" …', [], { message: 'failed', code })
			const { response, logLevels } = respond(new MigrationFailedError('2026-01-01-000000', queryError.message, queryError))

			expect(logLevels).toEqual(['error'])
			expect(response.ok).toBe(false)
			expect(response.error?.code).toBe(MigrateErrorCode.MigrationFailed)
			expect(response.error?.migration).toBe('2026-01-01-000000')
		}
	})

	test('does not log a rejected migration', () => {
		const { response, logLevels } = respond(new InvalidSchemaError('2026-01-01-000000', 'invalid'))

		expect(logLevels).toEqual([])
		expect(response.errors).toEqual([{
			code: MigrateErrorCode.InvalidSchema,
			migration: '2026-01-01-000000',
			developerMessage: '2026-01-01-000000: invalid',
		}])
	})
})
