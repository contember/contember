import { SQL } from 'bun'
import { expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { readAfterHeader, readAfterVisibleHeader, requireWriteRef, writeRefHeader } from '../src/readAfterWrite.js'
import { createTester, gql } from '../src/tester.js'

/**
 * Runs against an engine whose read replica is a real streaming standby, so that the replica can be
 * held back on purpose. Not part of `e2e/cases`: the standard suite runs with one database only.
 */
const replicaDsn = process.env.E2E_REPLICA_DSN
if (replicaDsn === undefined) {
	throw new Error('E2E_REPLICA_DSN is required: a superuser connection to the standby, so the tests can pause WAL replay.')
}

const pollTimeoutMs = 5000
const pollIntervalMs = 100

const pollUntil = async <T>(what: string, attempt: () => Promise<T | null>): Promise<T> => {
	const deadline = Date.now() + pollTimeoutMs
	for (;;) {
		const result = await attempt()
		if (result !== null) {
			return result
		}
		if (Date.now() >= deadline) {
			throw new Error(`Timed out after ${pollTimeoutMs} ms waiting for ${what}`)
		}
		await new Promise(resolve => setTimeout(resolve, pollIntervalMs))
	}
}

namespace ReplicaModel {
	export class Tag {
		label = c.stringColumn().unique()
	}
}

const listTagQuery = gql`
	query {
		listTag {
			label
		}
	}
`

test('Content API: a write ref keeps a query off a replica that has not applied it yet', async () => {
	const tester = await createTester(createSchema(ReplicaModel))
	const replica = new SQL(replicaDsn, { max: 1 })

	try {
		const created = await tester(
			gql`
				mutation {
					createTag(data: { label: "before" }) {
						ok
					}
				}
			`,
		).expect(200)
		const createdRef = requireWriteRef(created.get(writeRefHeader))

		// the standby is asynchronous, so the first acknowledgement may take a moment
		await pollUntil('the replica to apply the created row', async () => {
			const response = await tester(listTagQuery).set(readAfterHeader, createdRef).expect(200)
			return response.get(readAfterVisibleHeader) === createdRef ? response : null
		})

		await replica.unsafe('SELECT pg_wal_replay_pause()')
		// pausing is a request; only the paused state proves replay has actually stopped
		await pollUntil('WAL replay to pause', async () => {
			const rows = await replica.unsafe<{ state: string }[]>('SELECT pg_get_wal_replay_pause_state() AS state')
			return rows[0]?.state === 'paused' ? true : null
		})

		const updated = await tester(
			gql`
				mutation {
					updateTag(by: { label: "before" }, data: { label: "after" }) {
						ok
					}
				}
			`,
		).expect(200)
		expect(updated.body.data).toStrictEqual({ updateTag: { ok: true } })
		const updatedRef = requireWriteRef(updated.get(writeRefHeader))

		// the replica cannot serve this one, so it falls back to the primary and acknowledges nothing
		const consistent = await tester(listTagQuery).set(readAfterHeader, updatedRef).expect(200)
		expect(consistent.get(readAfterVisibleHeader)).toBeUndefined()
		expect(consistent.body.data).toStrictEqual({ listTag: [{ label: 'after' }] })

		// a query that asks for nothing still goes to the replica, lag included
		const stale = await tester(listTagQuery).expect(200)
		expect(stale.get(readAfterVisibleHeader)).toBeUndefined()
		expect(stale.body.data).toStrictEqual({ listTag: [{ label: 'before' }] })

		await replica.unsafe('SELECT pg_wal_replay_resume()')

		const acknowledged = await pollUntil('the replica to apply the update', async () => {
			const response = await tester(listTagQuery).set(readAfterHeader, updatedRef).expect(200)
			return response.get(readAfterVisibleHeader) === updatedRef ? response : null
		})
		expect(acknowledged.body.data).toStrictEqual({ listTag: [{ label: 'after' }] })
	} finally {
		// a standby left paused would break every later run
		await replica.unsafe('SELECT pg_wal_replay_resume()').catch((e: unknown) => {
			console.error('Failed to resume WAL replay on the replica', e)
		})
		await replica.close()
	}
})
