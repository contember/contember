import { test } from 'vitest'
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
            ok
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", true as "allowed" from "public"."post" as "root_" where "root_"."id" = ? and "root_"."locale" = ?`,
					parameters: [testUuid(1), 'cs'],
					response: { rows: [{ id: testUuid(1), allowed: true }] },
				},
				{
					sql: SQL`delete from "public"."post" where "id" in (?)`,
					parameters: [testUuid(1)],
					response: {  },
				},
			]),
		],
		return: {
			data: {
				deletePost: {
					ok: true,
				},
			},
		},
	})
})

