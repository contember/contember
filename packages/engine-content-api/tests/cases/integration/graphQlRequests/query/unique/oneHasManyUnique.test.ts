import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

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
				sql: SQL`select "root_"."id" as "root_id"
						from "public"."post" as "root_"
						where exists (select 1
						              from "public"."post_locale" as "root_locales"
						              where "root_"."id" = "root_locales"."post_id" and "root_locales"."id" = ?)`,
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

