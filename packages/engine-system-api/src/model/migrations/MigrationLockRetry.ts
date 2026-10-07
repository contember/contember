import { ClientErrorCodes, QueryError } from '@contember/database'
import { logger } from '@contember/logger'
import { MigrationFailedError } from './ProjectMigrator.js'

export interface MigrationLockOptions {
	/** Applied as `lock_timeout` to the migration transaction. */
	lockTimeoutMs: number
	/** How many times the whole migration transaction runs before a lock conflict is reported. */
	maxAttempts: number
	retryDelayMs: number
}

const lockConflictCodes = new Set<string | undefined>([ClientErrorCodes.LOCK_NOT_AVAILABLE, ClientErrorCodes.T_R_DEADLOCK_DETECTED])

interface MigrationTransaction {
	client: {
		query: (sql: string, parameters: readonly unknown[]) => Promise<unknown>
	}
}

interface TransactionRunner<Transaction extends MigrationTransaction> {
	transaction: <T>(cb: (trx: Transaction) => Promise<T>) => Promise<T>
}

const isLockConflict = (error: unknown): boolean => {
	const queryError = error instanceof MigrationFailedError ? error.previous : error
	return queryError instanceof QueryError && lockConflictCodes.has(queryError.code)
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
		if (!options) {
			return await db.transaction(migrate)
		}
		for (let attempt = 1;; attempt++) {
			try {
				return await db.transaction(async trx => {
					await trx.client.query(`SELECT set_config('lock_timeout', ?, true)`, [`${options.lockTimeoutMs}ms`])
					return await migrate(trx)
				})
			} catch (e) {
				if (attempt >= options.maxAttempts || !isLockConflict(e)) {
					throw e
				}
				logger.warn(`Migration hit a lock conflict (attempt ${attempt} of ${options.maxAttempts}), retrying in ${options.retryDelayMs} ms`, {
					error: e instanceof Error ? e.message : String(e),
				})
				await new Promise(resolve => setTimeout(resolve, options.retryDelayMs))
			}
		}
	}
}
