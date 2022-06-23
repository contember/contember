import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'

test('applies a filter', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            filter: {name: {eq: "Jack"}},
            data: {name: "John"}
          ) {
          ok
          author: node {
            id
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
					sql: SQL`with "newdata_" as
								(select ? :: text as "name", "root_"."id" from "public"."author" as "root_" where "root_"."id" = ? and "root_"."name" = ?)
								update "public"."author" set "name" = "newdata_"."name" from "newdata_" where "author"."id" = "newdata_"."id"`,
					parameters: ['John', testUuid(1), 'Jack'],
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
			]),
		],
		return: {
			data: {
				updateAuthor: {
					ok: true,
					author: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

