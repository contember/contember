import { Client, Connection, EventManagerImpl } from '@contember/database'
import 'uvu'
import * as assert from 'uvu/assert'

export interface ExpectedQuery {
	sql: string
	parameters?: any[]
	response: Partial<Connection.Result>
}

export const createConnectionMock = (
	queries: ExpectedQuery[],
): Connection.TransactionLike & Connection.ClientFactory & Connection.PoolStatusProvider => {
	return new (class implements Connection.TransactionLike {
		public readonly eventManager = new EventManagerImpl()

		async query<Row extends Record<string, any>>(
			sql: string,
			parameters?: any[],
			meta?: any,
			config?: Connection.QueryConfig,
		): Promise<Connection.Result<Row>> {
			const expected = queries.shift() || { sql: '', parameters: [], response: {} }

			const actualSql = sql.replace(/\s+/g, ' ').toLowerCase()
			const expectedSql = expected.sql.replace(/\s+/g, ' ').toLowerCase()
			assert.equal(expectedSql, actualSql)

			if (expected.parameters) {
				assert.equal(expected.parameters.length, (parameters || []).length)

				for (let index in expected.parameters) {
					const expectedParameter = expected.parameters[index]
					const actualParameter = (parameters || [])[index]
					if (typeof expectedParameter === 'function') {
						assert.equal(true, expectedParameter(actualParameter))
					} else if (expectedParameter instanceof Date && actualParameter instanceof Date) {
						assert.equal(expectedParameter, actualParameter)
					} else {
						assert.equal(expectedParameter, actualParameter)
					}
				}
			}
			await new Promise(resolve => setTimeout(resolve, 1))

			return expected.response as any
		}

		async transaction<Result>(
			trx: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		): Promise<Result> {
			await this.query('BEGIN;')
			const result = await trx(this)
			if (!this.isClosed) {
				await this.commit()
			}
			return result
		}

		isClosed: boolean = false

		async commit(): Promise<void> {
			this.isClosed = true
			await this.query('COMMIT;')
		}

		async rollback(): Promise<void> {
			this.isClosed = true
			await this.query('ROLLBACK;')
		}

		public createClient(schema: string, meta: Record<string, any>): Client {
			return new Client(this, schema, meta)
		}

		getPoolStatus(): Connection.PoolStatus {
			return {
				idleCount: 0,
				totalCount: 1,
				waitingCount: 0,
				maxCount: 1,
			}
		}
	})()
}
