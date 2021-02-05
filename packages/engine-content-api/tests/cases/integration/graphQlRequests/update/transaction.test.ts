import { test } from 'uvu'
import { execute, failedTransaction, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('executes in a transaction', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            author: node {
              id
            }
          }
          update2: updateAuthor(
              by: {id: "${testUuid(2)}"},
              data: {name: "Jack"}
            ) {
            ok
            author: node {
              id
            }
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select
                  ? :: text as "name",
                  "root_"."id"
                from "public"."author" as "root_"
                where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
					parameters: ['John', testUuid(1)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "newData_" as (select
                  ? :: text as "name",
                  "root_"."id"
                from "public"."author" as "root_"
                where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
					parameters: ['Jack', testUuid(2)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(2) }],
					},
					parameters: [testUuid(2)],
				},
			]),
		],
		return: {
			data: {
				transaction: {
					updateAuthor: {
						ok: true,
						author: {
							id: testUuid(1),
						},
					},
					update2: {
						ok: true,
						author: {
							id: testUuid(2),
						},
					},
					ok: true,
				},
			},
		},
	})
})

test('executes fails a transaction', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        transaction {
          ok
          errorMessage
          updateAuthor(
              by: {id: "${testUuid(1)}"},
              data: {name: "John"}
            ) {
            ok
            author: node {
              id
            }
          }
          update2: updateAuthor(
              by: {id: "${testUuid(2)}"},
              data: {name: "Jack"}
            ) {
            ok
            author: node {
              id
            }
          }
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
					sql: SQL`with "newData_" as (select
                  ? :: text as "name",
                  "root_"."id"
                from "public"."author" as "root_"
                where "root_"."id" = ?) update "public"."author"
              set "name" = "newData_"."name" from "newData_"
              where "author"."id" = "newData_"."id"`,
					parameters: ['John', testUuid(1)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [] },
				},
			]),
		],
		return: {
			data: {
				transaction: {
					updateAuthor: {
						ok: false,
						author: null,
					},
					update2: {
						ok: false,
						author: null,
					},
					ok: false,
					errorMessage: `Execution has failed:\nupdate2: NotFoundOrDenied (for input {"id":"123e4567-e89b-12d3-a456-000000000002"})`,
				},
			},
		},
	})
})

test.run()
