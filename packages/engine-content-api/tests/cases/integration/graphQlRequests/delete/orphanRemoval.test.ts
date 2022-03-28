import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('delete post and orphaned content', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.oneHasOne('content', relation => relation.target('Content').removeOrphan()))
			.entity('Content', entity => entity.column('text'))
			.buildSchema(),
		query: GQL`
        mutation {
          deletePost(by: {id: "${testUuid(1)}"}) {
            node {
              id
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
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
						sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1) }] },
					},
					{
						sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."id" = ?)
            returning "id", "content_id"`,
						parameters: [testUuid(1)],
						response: { rows: [{ id: testUuid(1), content_id: testUuid(2) }] },
					},
					{
						sql: SQL`delete from "public"."content"
            where "id" in (select "root_"."id"
                           from "public"."content" as "root_"
                           where "root_"."id" in (?))
            returning "id"`,
						parameters: [testUuid(2)],
						response: { rows: [{ id: testUuid(2) }] },
					},
				]),
			]),
		],
		return: {
			data: {
				deletePost: {
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})


