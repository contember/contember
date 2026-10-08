import { SchemaBuilder } from '@contember/schema-definition'
import { Input } from '@contember/schema'
import { describe, test } from 'bun:test'
import { execute } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

// The has-one filter of react-dataview (`createHasOneFilter`) mixes `in` / `notIn` with `isNull` on the target
// primary. Without a read guard on the hop these stay conditions on the FK column, so the FK index is usable;
// an `EXISTS … OR NOT EXISTS …` lowering of the same filter cannot use it.

const schema = new SchemaBuilder()
	.entity('Post', e => e.column('title').manyHasOne('author', r => r.target('Author')))
	.entity('Author', e => e.column('name'))
	.buildSchema()

const runAuthorIdFilter = async (idCondition: Input.Condition, where: string, parameters: unknown[]) => {
	await execute({
		schema,
		query: GQL`
			query($filter: PostWhere) {
				listPost(filter: $filter) {
					id
				}
			}`,
		queryVariables: { filter: { author: { id: idCondition } } },
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id" from "public"."post" as "root_" ${where}`,
				parameters,
				response: { rows: [] },
			},
		],
		return: { data: { listPost: [] } },
	})
}

const a = testUuid(1)
const b = testUuid(2)

describe('react-dataview has-one filter, unrestricted role', () => {
	test('id', async () => {
		await runAuthorIdFilter({ and: [{ or: [{ in: [a, b] }] }] }, SQL`where "root_"."author_id" in (?, ?)`, [a, b])
	})

	test('id or null', async () => {
		await runAuthorIdFilter(
			{ and: [{ or: [{ in: [a, b] }, { isNull: true }] }] },
			SQL`where ("root_"."author_id" in (?, ?) or "root_"."author_id" is null)`,
			[a, b],
		)
	})

	test('null', async () => {
		await runAuthorIdFilter({ and: [{ or: [{ isNull: true }] }] }, SQL`where "root_"."author_id" is null`, [])
	})

	test('notId', async () => {
		await runAuthorIdFilter(
			{ and: [{ or: [] }, { or: [{ notIn: [a] }, { isNull: true }] }] },
			SQL`where (not("root_"."author_id" in (?)) or "root_"."author_id" is null)`,
			[a],
		)
	})

	test('not null', async () => {
		await runAuthorIdFilter({ and: [{ or: [] }, { isNull: false }] }, SQL`where not("root_"."author_id" is null)`, [])
	})

	test('id or null, combined with notId and not null', async () => {
		await runAuthorIdFilter(
			{ and: [{ or: [{ in: [a, b] }, { isNull: true }] }, { or: [{ notIn: [b] }, { isNull: true }] }, { isNull: false }] },
			SQL`where ("root_"."author_id" in (?, ?) or "root_"."author_id" is null)
				and (not("root_"."author_id" in (?)) or "root_"."author_id" is null)
				and not("root_"."author_id" is null)`,
			[a, b, b],
		)
	})
})
