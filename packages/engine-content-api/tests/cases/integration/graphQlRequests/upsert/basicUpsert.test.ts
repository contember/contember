import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('upsert author (not exists)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.column('slug', c => c.type(Model.ColumnType.String).unique()),
			)
			.buildSchema(),
		query: GQL`
          mutation {
              upsertAuthor(by: {slug: "john-doe"}, update: {name: "John Doe"}, create: {slug: "john-doe", name: "John Doe"}) {
                  ok
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id"
					from "public"."author" as "root_"  where "root_"."slug" = ?`,
					parameters: ['john-doe'],
					response: { rows: [] },
				},
				{
					sql: SQL`
						with "root_" as
    					(select ? :: uuid as "id", ? :: text as "name", ? :: text as "slug")
						insert into  "public"."author" ("id", "name", "slug") select "root_"."id", "root_"."name", "root_"."slug"  from
 						"root_"  returning "id"
					`,
					parameters: [testUuid(1), 'John Doe', 'john-doe'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"  from "public"."author" as "root_"  where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ root_id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				upsertAuthor: {
					ok: true,
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

test('upsert author (exists)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.column('slug', c => c.type(Model.ColumnType.String).unique()),
			)
			.buildSchema(),
		query: GQL`
          mutation {
              upsertAuthor(by: {slug: "john-doe"}, update: {name: "John Doe"}, create: {slug: "john-doe", name: "John Doe"}) {
                  ok
                  node {
                      id
                  }
              }
          }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id"
					from "public"."author" as "root_"  where "root_"."slug" = ?`,
					parameters: ['john-doe'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`
						with "newData_" as
    					(select ? :: text as "name", "root_"."id", "root_"."slug"  from "public"."author" as "root_"  where "root_"."id" = ?)
						update  "public"."author" set  "name" =  "newData_"."name"
  						from "newData_"  where "author"."id" = "newData_"."id"
					`,
					parameters: ['John Doe', testUuid(2)],
					response: { rowCount: 1 },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"  from "public"."author" as "root_"  where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ root_id: testUuid(2) }] },
				},
			]),
		],
		return: {
			data: {
				upsertAuthor: {
					ok: true,
					node: {
						id: testUuid(2),
					},
				},
			},
		},
	})
})

