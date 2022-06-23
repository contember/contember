import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'

test('delete author with posts and locales cascade delete', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity.manyHasOne('author', relation => relation.target('Author').onDelete(Model.OnDelete.cascade)),
			)
			.entity('PostLocales', entity =>
				entity.manyHasOne('post', relation => relation.target('Post').onDelete(Model.OnDelete.cascade)),
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
						sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."author_id" in (?))
            returning "id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(2) }, { id: testUuid(3) }] },
					},
					{
						sql: SQL`delete from "public"."post_locales"
            where "id" in (select "root_"."id"
                           from "public"."post_locales" as "root_"
                           where "root_"."post_id" in (?, ?))
            returning "id"`,
						parameters: [testUuid(2), testUuid(3)],
						response: { rows: [{ id: testUuid(4) }, { id: testUuid(5) }] },
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


