import { Client, Connection, DatabaseCredentials, EventManager } from '@contember/database'
import 'uvu'
import * as assert from 'uvu/assert'

export interface ExpectedQuery {
	sql: string
	parameters?: any[]
	response: Partial<Connection.Result>
}

export class ConnectionMock implements Connection.ConnectionType  {

	public config: DatabaseCredentials = { database: '', host: '', password: '', user: '', port: 5432 }

	constructor(
		private readonly queries: ExpectedQuery[],
		public readonly eventManager = new EventManager(),
	) {
	}

	async query<Row extends Record<string, any>>(
		sql: string,
		parameters?: any[],
		meta?: any,
		config?: Connection.QueryConfig,
	): Promise<Connection.Result<Row>> {
		const expected = this.queries.shift() || { sql: '', parameters: [], response: {} }

		const actualSql = sql.replace(/\s+/g, ' ').toLowerCase()
		const expectedSql = expected.sql.replace(/\s+/g, ' ').toLowerCase()

		const expectedMsg = `Expected query does not match SQL:
${sql}
with following parameters
${JSON.stringify(parameters, undefined, '  ')}

Expected:
${expected.sql}`
		assert.is(actualSql, expectedSql, expectedMsg)
		const evm = config?.eventManager ?? this.eventManager
		if (expected.parameters) {
			assert.is((parameters || []).length, expected.parameters.length, expectedMsg)

			for (let index in expected.parameters) {
				const expectedParameter = expected.parameters[index]
				const actualParameter = (parameters || [])[index]
				if (typeof expectedParameter === 'function') {
					assert.is(expectedParameter(actualParameter), true, expectedMsg)
				} else {
					assert.equal(actualParameter, expectedParameter, expectedMsg)
				}
			}
		}
		evm.fire(EventManager.Event.queryStart, { sql: expected.sql, parameters: expected.parameters ?? [], meta })
		await new Promise(resolve => setTimeout(resolve, 1))
		evm.fire(EventManager.Event.queryEnd, {
			sql: expected.sql,
			parameters: expected.parameters ?? [],
			meta,
		}, {} as any)

		return expected.response as any
	}

	async transaction<Result>(
		trx: (connection: Connection.TransactionLike) => Promise<Result> | Result,
		options: { eventManager?: EventManager } = {},
	): Promise<Result> {
		await this.query('BEGIN;')
		const transaction = new ConnectionMock(this.queries, new EventManager(options.eventManager ?? this.eventManager))
		const result = await trx(transaction)
		if (!transaction.isClosed) {
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
		return new Client(this, schema, meta, new EventManager(this.eventManager))
	}

	getPoolStatus(): Connection.PoolStatus {
		return {
			idleCount: 0,
			totalCount: 1,
			waitingCount: 0,
			maxCount: 1,
		}
	}
}

export const createConnectionMock = (
	queries: ExpectedQuery[],
): Connection.ConnectionType => {
	return new ConnectionMock(queries)
}
