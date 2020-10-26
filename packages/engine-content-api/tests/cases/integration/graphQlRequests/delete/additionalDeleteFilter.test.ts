import { test } from 'uvu'
import { execute, sqlTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('delete post with additional filter', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('locale', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deletePost(by: {id: "${testUuid(1)}"}, filter: {locale: {eq: "cs"}}) {
            node {
              id
            }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select
                     "root_"."id" as "root_id"
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
				{
					sql: SQL`SET CONSTRAINTS ALL DEFERRED`,
					parameters: [],
					response: 1,
				},
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`delete from "public"."post"
            where "id" in (select "root_"."id"
                           from "public"."post" as "root_"
                           where "root_"."id" = ? and "root_"."locale" = ?)
            returning "id"`,
					parameters: [testUuid(1), 'cs'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`SET CONSTRAINTS ALL IMMEDIATE`,
					parameters: [],
					response: 1,
				},
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
test.run()
