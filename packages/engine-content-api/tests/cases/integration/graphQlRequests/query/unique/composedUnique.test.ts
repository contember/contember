import { test } from 'vitest'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('Post locale by post and locale (composed unique)', async () => {
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
          getPostLocale(by: {post: {id: "${testUuid(1)}"}, locale: "cs"}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post_locale" as "root_"
                     where "root_"."locale" = ? and "root_"."post_id" = ?`,
				parameters: ['cs', testUuid(1)],
				response: { rows: [{ root_id: testUuid(2) }] },
			},
		],
		return: {
			data: {
				getPostLocale: {
					id: testUuid(2),
				},
			},
		},
	})
})

