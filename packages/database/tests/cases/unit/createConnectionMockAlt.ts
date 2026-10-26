import { Connection, Pool, PoolConfig } from '../../../src/index.js'
import { PgClient } from '../../../src/client/PgClient.js'
import EventEmitter from 'node:events'
import { expect } from 'bun:test'

// `error` rejects the query; with `lost`, the client first emits `error` as pg does when the server closes the connection.
type MockQuery = { sql: string; timeout?: number; result?: any; error?: Error; lost?: boolean }

export const createConnectionMockAlt = (...queries: MockQuery[][]): [Connection, () => void] => {
	return createConnectionMockAltWithPool({}, ...queries)
}

export const createConnectionMockAltWithPool = (
	poolConfig: Partial<Omit<PoolConfig, 'logError'>>,
	...queries: MockQuery[][]
): [Connection, () => void] => {
	return createConnectionMockAltWithOptions({ pool: poolConfig }, ...queries)
}

export const createConnectionMockAltWithOptions = (
	{ pool: poolConfig = {}, connection: connectionOptions = {} }: {
		pool?: Partial<Omit<PoolConfig, 'logError'>>
		connection?: Connection.Options
	},
	...queries: MockQuery[][]
): [Connection, () => void] => {
	const connectionMocks: (PgClient & { assertEmpty: () => void })[] = []
	for (const queriesSet of queries) {
		connectionMocks.push(
			new class extends EventEmitter {
				readonly host = 'unused'
				readonly port = 5432
				readonly processID = null
				readonly secretKey = null

				connect() {
					return Promise.resolve()
				}

				end() {
					return Promise.resolve()
				}

				async query(sql: string) {
					const query = queriesSet.shift()
					expect(query).toBeDefined()
					expect(sql).toEqual(query?.sql as string)
					await new Promise<void>(resolve => setTimeout(resolve, query?.timeout ?? 1))
					if (query?.lost) {
						this.emit('error', query.error)
					}
					if (query?.error) {
						throw query.error
					}

					return query?.result
				}

				assertEmpty() {
					expect(queriesSet).toStrictEqual([])
				}
			}(),
		)
	}
	const allMocks = [...connectionMocks]
	const pool = new Pool(() => {
		return connectionMocks.shift() ?? (() => {
			throw new Error('No connection')
		})()
	}, { ...poolConfig, logError: () => null })
	return [
		new Connection(pool, undefined, connectionOptions),
		() => {
			allMocks.forEach(it => it.assertEmpty())
		},
	]
}
