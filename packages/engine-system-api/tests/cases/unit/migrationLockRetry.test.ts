import { describe, expect, test } from 'bun:test'
import { ClientErrorCodes, QueryError } from '@contember/database'
import { createLogger, TestLoggerHandler, withLogger } from '@contember/logger'
import { MigrationFailedError, MigrationLockOptions, MigrationLockRetry } from '../../../src/model/index.js'

const options: MigrationLockOptions = { lockTimeoutMs: 1500, maxAttempts: 3, retryDelayMs: 0 }

const queryError = (code: string) => new QueryError('ALTER TABLE "author" …', [], { message: 'conflict', code })
const migrationFailed = (code: string) => new MigrationFailedError('2026-01-01-000000', 'conflict', queryError(code))

// Records the queries each transaction runs; the migration callback itself never touches the database.
const createDb = () => {
	const transactions: string[][] = []
	const db = {
		transaction: async <T>(cb: (trx: { client: { query: (sql: string, parameters: readonly unknown[]) => Promise<unknown> } }) => Promise<T>) => {
			const queries: string[] = []
			transactions.push(queries)
			return await cb({ client: { query: async (sql, parameters) => queries.push(`${sql} ${parameters.join(',')}`) } })
		},
	}
	return { db, transactions }
}

// Runs a migration that throws the given errors in turn and then succeeds.
const run = async (options: MigrationLockOptions | undefined, errors: Error[]) => {
	const { db, transactions } = createDb()
	const handler = new TestLoggerHandler()
	const migrate = async () => {
		const error = errors.shift()
		if (error) {
			throw error
		}
		return 'done'
	}
	const outcome = await withLogger(createLogger(handler), () => new MigrationLockRetry(options).run(db, migrate))
		.then(result => ({ result, error: undefined }), (error: unknown) => ({ result: undefined, error }))
	return { ...outcome, transactions, logLevels: handler.messages.map(it => it.level.name) }
}

describe('migration lock retry', () => {
	test('without options runs the transaction once, sets no lock timeout and logs the lock conflict as an error', async () => {
		const lockConflict = migrationFailed(ClientErrorCodes.LOCK_NOT_AVAILABLE)
		const { error, transactions, logLevels } = await run(undefined, [lockConflict])

		expect(error).toBe(lockConflict)
		expect(transactions).toEqual([[]])
		expect(logLevels).toEqual(['error'])
	})

	test('sets the lock timeout and retries a lock timeout and a deadlock, logging warnings only', async () => {
		const { result, transactions, logLevels } = await run(options, [
			migrationFailed(ClientErrorCodes.LOCK_NOT_AVAILABLE),
			queryError(ClientErrorCodes.T_R_DEADLOCK_DETECTED),
		])

		expect(result).toBe('done')
		expect(transactions).toEqual(Array(3).fill([`SELECT set_config('lock_timeout', ?, true) 1500ms`]))
		expect(logLevels).toEqual(['warn', 'warn'])
	})

	test('reports the lock conflict as an error once the attempts run out', async () => {
		const errors = [1, 2, 3].map(() => migrationFailed(ClientErrorCodes.LOCK_NOT_AVAILABLE))
		const last = errors[2]
		const { error, transactions, logLevels } = await run(options, errors)

		expect(error).toBe(last)
		expect(transactions).toHaveLength(3)
		expect(logLevels).toEqual(['warn', 'warn', 'error'])
	})

	test('does not retry other failures', async () => {
		const uniqueViolation = migrationFailed(ClientErrorCodes.UNIQUE_VIOLATION)
		const { error, transactions } = await run(options, [uniqueViolation])

		expect(error).toBe(uniqueViolation)
		expect(transactions).toHaveLength(1)
	})
})
