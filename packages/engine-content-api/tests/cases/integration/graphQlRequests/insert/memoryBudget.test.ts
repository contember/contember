import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { RequestMemoryBudget } from '@contember/database'
import { GQL, SQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'

const insertAuthor = (id: string) => ({
	sql: SQL`with "root_" as
		(select ? :: uuid as "id", ? :: text as "name")
		insert into "public"."author" ("id", "name")
		select "root_"."id", "root_"."name"
		from "root_"
		returning "id"`,
	parameters: [id, 'John'],
	response: { rows: [{ id }] },
})

const selectAuthor = (id: string) => ({
	sql: SQL`select "root_"."id" as "root_id"
		from "public"."author" as "root_"
		where "root_"."id" = ?`,
	parameters: [id],
	response: { rows: [{ root_id: id }] },
})

test('an exhausted memory budget fails its own mutation and keeps the committed sibling', async () => {
	const exhausted = {
		ok: false,
		errors: [{ type: 'ResourceExhausted', message: 'Request memory budget exceeded' }],
		node: null,
	}
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity => entity.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		// One hydrated author is estimated at 112 bytes, so the second result node exceeds the budget.
		memoryBudget: new RequestMemoryBudget({ warnBytes: 200, maxBytes: 200 }),
		query: GQL`
			mutation {
				first: createAuthor(data: {name: "John"}) { ok errors { type message } node { id } }
				second: createAuthor(data: {name: "John"}) { ok errors { type message } node { id } }
				third: createAuthor(data: {name: "John"}) { ok errors { type message } node { id } }
			}`,
		executes: [
			...sqlTransaction([insertAuthor(testUuid(1)), selectAuthor(testUuid(1))]),
			// Every transaction draws one uuid for its own id, so the second author gets the third one.
			...failedTransaction([insertAuthor(testUuid(3)), selectAuthor(testUuid(3))]),
		],
		return: {
			data: {
				first: { ok: true, errors: [], node: { id: testUuid(1) } },
				second: exhausted,
				third: exhausted,
			},
		},
	})
})
