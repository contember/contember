import { Connection, Pool } from '../../../src'
import { PgClient } from '../../../src/client/PgClient'
import EventEmitter from 'node:events'
import { expect } from 'vitest'

export const createConnectionMockAlt = (...queries: { sql: string; timeout?: number; result?: any }[][]): [Connection, () => void] => {
	const connectionMocks: (PgClient & { assertEmpty: () => void })[] = []
	for (const queriesSet of queries) {
		connectionMocks.push(new class extends EventEmitter {
			connect() {
				return Promise.resolve()
			}

			end() {
				return Promise.resolve()
			}

			async query(sql: string) {
				const query = queriesSet.shift()
				expect(query).toBeDefined()
				expect(sql).toEqual(query?.sql)
				await new Promise<void>(resolve => setTimeout(resolve, query?.timeout ?? 1))

				return query?.result
			}

			assertEmpty() {
				expect(queriesSet).deep.eq([])
			}
		})
	}
	const allMocks = [...connectionMocks]
	const pool = new Pool(() => {
		return connectionMocks.shift() ?? (() => {
			throw new Error('No connection')
		})()
	}, { logError: () => null })
	return [
		new Connection(pool),
		() => {
			allMocks.forEach(it => it.assertEmpty())
		},
	]
}
