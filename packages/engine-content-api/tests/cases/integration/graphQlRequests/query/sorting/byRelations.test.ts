import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Post locale ordered by author name', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('PostLocale', entity =>
				entity.manyHasOne('post', r =>
					r.target('Post', e =>
						e.manyHasOne('author', r =>
							r.target('Author', e => e.column('name', c => c.type(Model.ColumnType.String))),
						),
					),
				),
			)
			.buildSchema(),
		query: GQL`
        query {
          listPostLocale(orderBy: [{post: {author: {name: asc}}}, {id: desc}]) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id"
                     from "public"."post_locale" as "root_" left join "public"."post" as "root_post" on "root_"."post_id" = "root_post"."id"
                       left join "public"."author" as "root_post_author" on "root_post"."author_id" = "root_post_author"."id"
                     order by "root_post_author"."name" asc, "root_"."id" desc`,
				response: {
					rows: [{ root_id: testUuid(2) }],
				},
			},
		],
		return: {
			data: {
				listPostLocale: [
					{
						id: testUuid(2),
					},
				],
			},
		},
	})
})

