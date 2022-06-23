import { test } from 'vitest'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('Post by post locale (one-has-many unique)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.column('title', column => column.type(Model.ColumnType.String))
					.oneHasMany('locales', relation => relation.target('PostLocale').ownedBy('post')),
			)
			.entity('PostLocale', entity =>
				entity
					.unique(['locale', 'post'])
					.column('locale', column => column.type(Model.ColumnType.String))
					.column('title', column => column.type(Model.ColumnType.String)),
			)
			.buildSchema(),
		query: GQL`
        query {
          getPost(by: {locales: {id: "${testUuid(1)}"}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`SELECT "root_"."id" AS "root_id"
						         FROM "public"."post" AS "root_"
						         WHERE EXISTS (SELECT 1 FROM "public"."post_locale" AS "sub_" WHERE "root_"."id" = "sub_"."post_id" AND "sub_"."id" = ?)`,
				parameters: [testUuid(1)],
				response: { rows: [{ root_id: testUuid(2) }] },
			},
		],
		return: {
			data: {
				getPost: {
					id: testUuid(2),
				},
			},
		},
	})
})

