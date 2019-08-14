import { Client, Connection, EventManager } from '../'

export interface ExpectedQuery {
	sql: string
	parameters?: any[]
	response: Partial<Connection.Result>
}

class MockExpectationError extends Error {}

const assertEquals = (expected: any, actual: any) => {
	if (expected !== actual) {
		throw new MockExpectationError(`Assertion failed:
ACTUAL:   ${JSON.stringify(actual)}
EXPECTED: ${JSON.stringify(expected)}
`)
	}
}
const assertDeepEquals = (expected: any, actual: any) => {
	try {
		assertEquals(typeof expected, typeof actual)
		if (Array.isArray(expected)) {
			assertEquals(Array.isArray(actual), true)
			assertLength(expected.length, actual)
			for (let i in expected) {
				assertDeepEquals(expected[i], actual[i])
			}
		} else {
			assertEquals(expected, actual) // todo
		}
	} catch (e) {
		if (e instanceof MockExpectationError) {
			throw new MockExpectationError(
				`Assertion failed:
ACTUAL:   ${JSON.stringify(actual)}
EXPECTED: ${JSON.stringify(expected)}
---- prev:
` + e.message,
			)
		}
		throw e
	}
}

const assertLength = (expectedLength: number, actual: any[]) => {
	if (actual.length !== expectedLength) {
		throw new MockExpectationError(`Assertion failed: ${actual.length} should be ${expectedLength}`)
	}
}

export const createConnectionMock = (
	queries: ExpectedQuery[],
): Connection.TransactionLike & Connection.ClientFactory => {
	return new (class implements Connection.TransactionLike {
		public readonly eventManager = new EventManager()

		query<Row extends Record<string, any>>(
			sql: string,
			parameters?: any[],
			meta?: any,
			config?: Connection.QueryConfig,
		): Promise<Connection.Result<Row>> {
			if (sql === 'ROLLBACK;') {
				return null as any
			}

			const expected = queries.shift()
			if (!expected) {
				throw new MockExpectationError(`Unexpected query:
${sql}
${JSON.stringify(parameters)}
`)
			}
			const actualSql = sql.replace(/\s+/g, ' ')
			const expectedSql = expected.sql.replace(/\s+/g, ' ')
			assertEquals(expectedSql, actualSql)

			if (expected.parameters) {
				assertLength(expected.parameters.length, parameters || [])
				for (let index in expected.parameters) {
					const expectedParameter = expected.parameters[index]
					const actualParameter = (parameters || [])[index]
					if (typeof expectedParameter === 'function') {
						assertEquals(true, expectedParameter(actualParameter))
					} else if (expectedParameter instanceof Date && actualParameter instanceof Date) {
						assertEquals(actualParameter.getTime(), expectedParameter.getTime())
					} else {
						assertDeepEquals(expectedParameter, actualParameter)
					}
				}
			}

			return expected.response as any
		}

		async transaction<Result>(
			trx: (connection: Connection.TransactionLike) => Promise<Result> | Result,
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
