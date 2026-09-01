import { expect, test } from 'bun:test'
import { c, createSchema } from '@contember/schema-definition'
import { createTester, gql } from '../../src/tester.js'
import { readAfterHeader, readAfterVisibleHeader, requireWriteRef, writeRefHeader } from '../../src/readAfterWrite.js'

// a fixed id keeps the materialized view down to a single row
const statsId = '00000000-0000-0000-0000-000000000000'

namespace ReadAfterWriteModel {
	export class Tag {
		label = c.stringColumn()
	}

	@c.DisableEventLog()
	export class Silent {
		label = c.stringColumn()
	}

	@c.View(`SELECT '${statsId}'::uuid AS id, COUNT(*)::int AS total FROM tag`, {
		materialized: true,
	})
	@c.Unique({ fields: ['id'], index: true })
	export class TagStats {
		id = c.uuidColumn().notNull()
		total = c.intColumn()
	}
}

const createTagMutation = gql`
	mutation {
		createTag(data: { label: "read-after-write" }) {
			ok
		}
	}
`

const listTagQuery = gql`
	query {
		listTag {
			label
		}
	}
`

test('Content API: a mutation returns a write ref and a following query acknowledges it', async () => {
	const tester = await createTester(createSchema(ReadAfterWriteModel))

	const mutation = await tester(createTagMutation).expect(200)
	const writeRef = requireWriteRef(mutation.get(writeRefHeader))

	const query = await tester(listTagQuery).set(readAfterHeader, writeRef).expect(200)
	expect(query.get(readAfterVisibleHeader)).toBe(writeRef)
	expect(query.body.data).toStrictEqual({ listTag: [{ label: 'read-after-write' }] })

	// without the header there is nothing to acknowledge
	const plain = await tester(listTagQuery).expect(200)
	expect(plain.get(readAfterVisibleHeader)).toBeUndefined()
})

test('Content API: a token the engine cannot check is answered without an acknowledgement', async () => {
	const tester = await createTester(createSchema(ReadAfterWriteModel))

	const mutation = await tester(createTagMutation).expect(200)
	const writeRef = requireWriteRef(mutation.get(writeRefHeader))
	const xid = writeRef.slice(writeRef.indexOf(':') + 1)

	// a token of another cluster: valid in shape, unusable here
	const foreign = await tester(listTagQuery).set(readAfterHeader, `999:${xid}`).expect(200)
	expect(foreign.get(readAfterVisibleHeader)).toBeUndefined()
	expect(foreign.body.data).toStrictEqual({ listTag: [{ label: 'read-after-write' }] })

	const malformed = await tester(listTagQuery).set(readAfterHeader, 'abc').expect(200)
	expect(malformed.get(readAfterVisibleHeader)).toBeUndefined()
	expect(malformed.body.data).toStrictEqual({ listTag: [{ label: 'read-after-write' }] })
})

test('Content API: at most 16 tokens are checked, more are answered without an acknowledgement', async () => {
	const tester = await createTester(createSchema(ReadAfterWriteModel))

	const writeRefs: string[] = []
	for (let i = 0; i < 17; i++) {
		const mutation = await tester(createTagMutation).expect(200)
		writeRefs.push(requireWriteRef(mutation.get(writeRefHeader)))
	}
	expect(new Set(writeRefs).size).toBe(17)

	const atLimit = writeRefs.slice(0, 16).join(',')
	const accepted = await tester(listTagQuery).set(readAfterHeader, atLimit).expect(200)
	expect(accepted.get(readAfterVisibleHeader)).toBe(atLimit)

	const rejected = await tester(listTagQuery).set(readAfterHeader, writeRefs.join(',')).expect(200)
	expect(rejected.get(readAfterVisibleHeader)).toBeUndefined()
})

test('Content API: a write ref covers writes the event log does not see', async () => {
	const tester = await createTester(createSchema(ReadAfterWriteModel))

	const silent = await tester(
		gql`
			mutation {
				createSilent(data: { label: "read-after-write" }) {
					ok
				}
			}
		`,
	).expect(200)
	expect(silent.body.data).toStrictEqual({ createSilent: { ok: true } })
	requireWriteRef(silent.get(writeRefHeader))

	const refresh = await tester(
		gql`
			mutation {
				refreshMaterializedView(name: TagStats, options: { concurrently: true }) {
					ok
				}
			}
		`,
	).expect(200)
	expect(refresh.body.data).toStrictEqual({ refreshMaterializedView: { ok: true } })
	requireWriteRef(refresh.get(writeRefHeader))
})

test('Content API: a mutation that writes nothing returns no write ref', async () => {
	const tester = await createTester(createSchema(ReadAfterWriteModel))

	// a real write first, so an absent header below cannot simply mean the feature is off
	const written = await tester(createTagMutation).expect(200)
	requireWriteRef(written.get(writeRefHeader))

	const readOnly = await tester(
		gql`
			mutation {
				transaction {
					ok
					query {
						listTag {
							label
						}
					}
				}
			}
		`,
	).expect(200)
	expect(readOnly.body.data.transaction.ok).toBe(true)
	expect(readOnly.get(writeRefHeader)).toBeUndefined()
})
