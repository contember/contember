import { test } from 'vitest'
import { execute, failedTransaction } from '../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('delete post with acl (denied)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('locale', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          deletePost(by: {id: "${testUuid(1)}"}) {
            ok
            errorMessage
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
			locale_variable: { in: ['cs'] },
		},
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "id", "root_"."locale" in (?) as "allowed" from "public"."post" as "root_" where "root_"."id" = ?`,
					parameters: ['cs', testUuid(1)],
					response: {
						rows: [{ id: testUuid(1), allowed: false }],
					},
				},
			]),
		],
		return: {
			data: {
				deletePost: {
					ok: false,
					errorMessage: 'Execution has failed:\n' +
						'unknown field: NotFoundOrDenied (for input {"id":{"in":["123e4567-e89b-12d3-a456-000000000001"]}})',
				},
			},
		},
	})
})

