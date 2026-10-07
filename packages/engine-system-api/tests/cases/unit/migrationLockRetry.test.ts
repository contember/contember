import { describe, expect, test } from 'bun:test'
import { ClientErrorCodes, QueryError } from '@contember/database'
import { createLogger, TestLoggerHandler, withLogger } from '@contember/logger'
import { MigrationFailedError, MigrationLockOptions, MigrationLockRetry } from '../../../src/model/index.js'

const options: MigrationLockOptions = { lockTimeoutMs: 1500, maxAttempts: 3, retryDelayMs: 0 }

const queryError = (code: string) => new QueryError('ALTER TABLE "author" …', [], { message: 'conflict', code })

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

const run = <T>(options: MigrationLockOptions | undefined, db: ReturnType<typeof createDb>['db'], migrate: () => Promise<T>) =>
	withLogger(createLogger(new TestLoggerHandler()), () => new MigrationLockRetry(options).run(db, migrate))

const failing = (errors: Error[]) => async () => {
	const error = errors.shift()
	if (error) {
		throw error
	}
	return 'done'
}

describe('migration lock retry', () => {
	test('without options runs the transaction once and sets no lock timeout', async () => {
		const { db, transactions } = createDb()
		const lockConflict = new MigrationFailedError('2026-01-01-000000', 'lock timeout', queryError(ClientErrorCodes.LOCK_NOT_AVAILABLE))

		await expect(run(undefined, db, failing([lockConflict]))).rejects.toBe(lockConflict)
		expect(transactions).toEqual([[]])
	})

	test('sets the lock timeout and retries a lock timeout and a deadlock', async () => {
		const { db, transactions } = createDb()
		const errors = [
			new MigrationFailedError('2026-01-01-000000', 'lock timeout', queryError(ClientErrorCodes.LOCK_NOT_AVAILABLE)),
			queryError(ClientErrorCodes.T_R_DEADLOCK_DETECTED),
		]

		await expect(run(options, db, failing(errors))).resolves.toBe('done')
		expect(transactions).toHaveLength(3)
		for (const queries of transactions) {
			expect(queries).toEqual([`SELECT set_config('lock_timeout', ?, true) 1500ms`])
		}
	})

	test('reports the lock conflict once the attempts run out', async () => {
		const { db, transactions } = createDb()
		const errors = [1, 2, 3].map(() => new MigrationFailedError('2026-01-01-000000', 'lock timeout', queryError(ClientErrorCodes.LOCK_NOT_AVAILABLE)))
		const last = errors[2]

		await expect(run(options, db, failing(errors))).rejects.toBe(last)
		expect(transactions).toHaveLength(3)
	})

	test('does not retry other failures', async () => {
		const { db, transactions } = createDb()
		const uniqueViolation = new MigrationFailedError('2026-01-01-000000', 'duplicate key', queryError(ClientErrorCodes.UNIQUE_VIOLATION))

		await expect(run(options, db, failing([uniqueViolation]))).rejects.toBe(uniqueViolation)
		expect(transactions).toHaveLength(1)
	})
})
