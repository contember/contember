import { test } from 'vitest'
import { execute, sqlDeferred, sqlTransaction } from '../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Acl, Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags.js'
import { testUuid } from '../../../../src/testUuid.js'

test('delete post with acl', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('locale', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deletePost(by: {id: "${testUuid(1)}"}) {
            node {
              id
            }
          }
        }`,
		permissions: {
			Post: {
				predicates: {
					locale_predicate: { locale: 'locale_variable' },
				},
				operations: {
					delete: 'locale_predicate',
					read: {
						id: true,
					},
				},
			},
		},
		variables: {
			locale_variable: {
				definition: {
					type: Acl.VariableType.condition,
				},
				value: [{ in: ['cs'] }],
			},
		},
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
                           where "root_"."id" = ? and "root_"."locale" in (?))
            returning "id"`,
						parameters: [testUuid(1), 'cs'],
						response: { rows: [{ id: testUuid(1) }] },
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

