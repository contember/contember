import { QueryError } from '@contember/database'
import { logger } from '@contember/logger'
import { isLockConflict } from './lockConflict.js'
import { MigrationFailedError } from './ProjectMigrator.js'

export interface MigrationLockOptions {
	/** Applied as `lock_timeout` to the migration transaction. */
	lockTimeoutMs: number
	/** How many times the whole migration transaction runs before a lock conflict is reported. */
	maxAttempts: number
	retryDelayMs: number
}

interface MigrationTransaction {
	client: {
		query: (sql: string, parameters: readonly unknown[]) => Promise<unknown>
	}
}

interface TransactionRunner<Transaction extends MigrationTransaction> {
	transaction: <T>(cb: (trx: Transaction) => Promise<T>) => Promise<T>
}

const findLockConflict = (error: unknown): QueryError | undefined => {
	const queryError = error instanceof MigrationFailedError ? error.previous : error
	return queryError instanceof QueryError && isLockConflict(queryError) ? queryError : undefined
}

export class MigrationLockRetry {
	constructor(private readonly options: MigrationLockOptions | undefined) {}

	/**
	 * Without options the transaction runs once and waits for locks as long as PostgreSQL lets it.
	 * With them, a migration that cannot get its locks in time gives up, so the queries queued behind
	 * its pending ACCESS EXCLUSIVE request can run, and the whole transaction is tried again.
	 */
	async run<Transaction extends MigrationTransaction, T>(db: TransactionRunner<Transaction>, migrate: (trx: Transaction) => Promise<T>): Promise<T> {
		const options = this.options
		for (let attempt = 1;; attempt++) {
			try {
				return await db.transaction(async trx => {
					if (options) {
						await trx.client.query(`SELECT set_config('lock_timeout', ?, true)`, [`${options.lockTimeoutMs}ms`])
					}
					return await migrate(trx)
				})
			} catch (e) {
				const lockConflict = findLockConflict(e)
				if (!lockConflict) {
					throw e
				}
				if (!options || attempt >= options.maxAttempts) {
					logger.error(lockConflict, { message: 'Migration failed' })
					throw e
				}
				logger.warn(`Migration hit a lock conflict (attempt ${attempt} of ${options.maxAttempts}), retrying in ${options.retryDelayMs} ms`, {
					error: lockConflict.message,
				})
				await new Promise(resolve => setTimeout(resolve, options.retryDelayMs))
			}
		}
	}
}
