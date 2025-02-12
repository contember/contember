import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('delete author and set null on posts', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.setNull)),
			)
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deleteAuthor(by: {id: "${testUuid(1)}"}) {
            node {
              id
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [
							{
								root_id: testUuid(1),
							},
						],
					},
				},
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."author_id" as "ref", true as "allowed" from "public"."post" as "root_" where "root_"."author_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."author" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: { },
				},
			]),
		],
		return: {
			data: {
				deleteAuthor: {
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})


test('delete author and set null on posts - declined', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.setNull)),
			)
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deleteAuthor(by: {id: "${testUuid(1)}"}) {
            ok
            errorMessage
          }
        }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."author_id" as "ref", true as "allowed" from "public"."post" as "root_" where "root_"."author_id" in (?)`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(2), ref: testUuid(1), allowed: false }] },
				},
			]),
		],
		return: {
			data: {
				deleteAuthor: {
					ok: false,
					errorMessage: 'Execution has failed:\n' +
						'unknown field: ForeignKeyConstraintViolation (Cannot delete 123e4567-e89b-12d3-a456-000000000001 row(s) of entity Author, because it is still referenced from 123e4567-e89b-12d3-a456-000000000002 row(s) of entity Post in relation author. OnDelete behaviour of this relation is set to "set null". This is possibly caused by ACL denial.)',
				},
			},
		},
	})
})

