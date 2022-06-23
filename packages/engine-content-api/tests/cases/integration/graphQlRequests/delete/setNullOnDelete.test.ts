import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'

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
				...sqlDeferred([
					{
						sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."author"
            where "id" in (select "root_"."id"
                           from "public"."author" as "root_"
                           where "root_"."id" = ?)
            returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`with "newData_" as (select
                                           ? :: uuid as "author_id",
                                           "root_"."id"
                                         from "public"."post" as "root_"
                                         where "root_"."author_id" in (?)) update "public"."post"
            set "author_id" = "newData_"."author_id" from "newData_"
            where "post"."id" = "newData_"."id"`,
						parameters: [null, testUuid(1)],
						response: { rowCount: 1 },
					},
				]),
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

