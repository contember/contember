import Connection from '../../src/core/database/Connection'
import { expect } from 'chai'
import Client from '../../src/core/database/Client'
import EventManager from '../../src/core/database/EventManager'

export interface SqlQuery {
	sql: string
	parameters?: any[]
	response: Partial<Connection.Result>
}

class ConnectionMockError extends Error {}

export const createConnectionMock = (queries: SqlQuery[]): Connection.TransactionLike & Connection.ClientFactory => {
	return new (class implements Connection.TransactionLike {
		public readonly eventManager = new EventManager()

		query<Row extends Record<string, any>>(
			sql: string,
			parameters?: any[],
			meta?: any,
			config?: Connection.QueryConfig
		): Promise<Connection.Result<Row>> {
			if (sql === 'ROLLBACK;') {
				return null as any
			}

			const expected = queries.shift()
			if (!expected) {
				throw new ConnectionMockError(`Unexpected query:
${sql}
${JSON.stringify(parameters)}
`)
			}
			const actualSql = sql.replace(/\s+/g, ' ')
			const expectedSql = expected.sql.replace(/\s+/g, ' ')
			expect(sql.replace(/\s+/g, ' ')).eq(
				expected.sql.replace(/\s+/g, ' '),
				`SQL mismatch:
ACTUAL:   ${actualSql}
EXPECTED: ${expectedSql}
--- original message ---
`
			)
			if (expected.parameters) {
				expect(parameters || []).length(expected.parameters.length)
				for (let index in expected.parameters) {
					const expectedParameter = expected.parameters[index]
					const actualParameter = (parameters || [])[index]
					if (typeof expectedParameter === 'function') {
						expect(expectedParameter(actualParameter)).equal(true)
					} else if (expectedParameter instanceof Date && actualParameter instanceof Date) {
						expect(expectedParameter.getTime()).equal(actualParameter.getTime())
					} else {
						expect(actualParameter).deep.equals(expectedParameter)
					}
				}
			}

			return expected.response as any
		}

		async transaction<Result>(
			trx: (connection: Connection.TransactionLike) => Promise<Result> | Result
		): Promise<Result> {
			await this.query('BEGIN;')
			const result = await trx(createConnectionMock(queries))
			await this.commit()
			return result
		}

		isClosed: boolean = false

		async commit(): Promise<void> {
			await this.query('COMMIT;')
		}

		async rollback(): Promise<void> {
			await this.query('ROLLBACK;')
		}

		public createClient(schema: string): Client {
			return new Client(this, schema)
		}
	})()
}
