import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../src/test'
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
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."content_id" as "_content_id", true as "allowed" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ id: testUuid(1), _content_id: testUuid(2), allowed: true }],
					},
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."content" as "root_" where "root_"."id" in (?)`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ id: testUuid(2), allowed: true }],
					},
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."content_id" as "ref" from "public"."post" as "root_" where "content_id" in (?)`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ id: testUuid(1), ref: testUuid(2) }],
					},
				},
				{
					sql: SQL`delete from "public"."post" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: { },
				},
				{
					sql: SQL`delete from "public"."content" where "id" in (?)`,
					parameters: [testUuid(2)],
					response: { },
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


