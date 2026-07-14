import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../../src/test.js'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'
import { Model } from '@contember/schema'
import { SchemaBuilder } from '@contember/schema-definition'

const schema = new SchemaBuilder()
	.entity('Post', entity =>
		entity
			.column('title', column => column.type(Model.ColumnType.String))
			.manyHasOne('author', relation => relation.target('Author').inversedBy('posts').onDelete(Model.OnDelete.setNull)))
	.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
	.buildSchema()

const permissions = {
	Post: {
		predicates: {
			update_author: { title: 'allowed_title' },
		},
		operations: {
			read: { id: true, author: true },
			update: { id: true, author: 'update_author' },
		},
	},
	Author: {
		predicates: {},
		operations: {
			read: { id: true },
			create: { id: true, name: true },
			update: { id: true, name: true },
			delete: true,
		},
	},
}

const variables = {
	allowed_title: { eq: 'allowed post' },
}

test('relation-only nested update checks the source relation predicate before touching the target', async () => {
	await execute({
		schema,
		permissions,
		variables,
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {author: {update: {name: "updated"}}}) {
				ok
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select true as "authorized"
					from "public"."post" as "root_"
					where "root_"."id" = ? and "root_"."title" = ?
					for update of "root_"`,
				parameters: [testUuid(2), 'allowed post'],
				response: { rows: [] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: false,
				},
			},
		},
	})
})

test('relation-only nested update proceeds when the source relation predicate matches', async () => {
	await execute({
		schema,
		permissions,
		variables,
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {author: {update: {name: "updated"}}}) {
				ok
			}
		}`,
		executes: sqlTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select true as "authorized"
					from "public"."post" as "root_"
					where "root_"."id" = ? and "root_"."title" = ?
					for update of "root_"`,
				parameters: [testUuid(2), 'allowed post'],
				response: { rows: [{ authorized: true }] },
			},
			{
				sql: SQL`select "root_"."author_id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ author_id: testUuid(1) }] },
			},
			{
				sql: SQL`with "newData_" as
					(select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"
						from "public"."author" as "root_"
						where "root_"."id" = ?)
					update "public"."author" set "name" = "newData_"."name"
					from "newData_"
					where "author"."id" = "newData_"."id"
					returning "name_old__"`,
				parameters: ['updated', testUuid(1)],
				response: { rows: [{ name_old__: 'old' }] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: true,
				},
			},
		},
	})
})

test('relation-only nested upsert checks the source relation predicate before updating the existing target', async () => {
	await execute({
		schema,
		permissions,
		variables,
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {author: {upsert: {
				create: {name: "created"},
				update: {name: "updated"}
			}}}) {
				ok
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."author_id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ author_id: testUuid(1) }] },
			},
			{
				sql: SQL`select true as "authorized"
					from "public"."post" as "root_"
					where "root_"."id" = ? and "root_"."title" = ?
					for update of "root_"`,
				parameters: [testUuid(2), 'allowed post'],
				response: { rows: [] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: false,
				},
			},
		},
	})
})

test('relation-only nested delete checks the source relation predicate before deleting the target', async () => {
	await execute({
		schema,
		permissions,
		variables,
		query: GQL`mutation {
			updatePost(by: {id: "${testUuid(2)}"}, data: {author: {delete: true}}) {
				ok
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select true as "authorized"
					from "public"."post" as "root_"
					where "root_"."id" = ? and "root_"."title" = ?
					for update of "root_"`,
				parameters: [testUuid(2), 'allowed post'],
				response: { rows: [] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: false,
				},
			},
		},
	})
})

test('relation-only authorization denial takes precedence over a user filter mismatch', async () => {
	await execute({
		schema,
		permissions,
		variables,
		query: GQL`mutation {
			updatePost(
				by: {id: "${testUuid(2)}"},
				filter: {id: {eq: "${testUuid(3)}"}},
				data: {author: {update: {name: "updated"}}}
			) {
				ok
				errorMessage
			}
		}`,
		executes: failedTransaction([
			{
				sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
				parameters: [testUuid(2)],
				response: { rows: [{ id: testUuid(2) }] },
			},
			{
				sql: SQL`select "root_"."id" = ? as "filter_matches", "root_"."title" = ? as "authorized"
					from "public"."post" as "root_"
					where "root_"."id" = ?
					for update of "root_"`,
				parameters: [testUuid(3), 'allowed post', testUuid(2)],
				response: { rows: [{ filter_matches: false, authorized: false }] },
			},
		]),
		return: {
			data: {
				updatePost: {
					ok: false,
					errorMessage: 'Execution has failed:\nunknown field: NotFoundOrDenied ()',
				},
			},
		},
	})
})
