import { Connection, Pool, PoolConfig } from '../../../src/index.js'
import { PgClient } from '../../../src/client/PgClient.js'
import EventEmitter from 'node:events'
import { expect } from 'bun:test'

type MockQuery = { sql: string; timeout?: number; result?: any }

export const createConnectionMockAlt = (...queries: MockQuery[][]): [Connection, () => void] => {
	return createConnectionMockAltWithPool({}, ...queries)
}

export const createConnectionMockAltWithPool = (
	poolConfig: Partial<Omit<PoolConfig, 'logError'>>,
	...queries: MockQuery[][]
): [Connection, () => void] => {
	const connectionMocks: (PgClient & { assertEmpty: () => void })[] = []
	for (const queriesSet of queries) {
		connectionMocks.push(
			new class extends EventEmitter {
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
		new Connection(pool),
		() => {
			allMocks.forEach(it => it.assertEmpty())
		},
	]
}
