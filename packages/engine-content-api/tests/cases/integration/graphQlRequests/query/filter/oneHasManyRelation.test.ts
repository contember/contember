import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Author by post title (where one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity =>
				entity
					.manyHasOne('author', relation => relation.target('Author').inversedBy('posts'))
					.column('title', column => column.type(Model.ColumnType.String)),
			)
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listAuthor(filter: {posts: {title: {eq: "Hello"}}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."id" as "root_id" from "public"."author" as "root_"
                                 where exists (select 1
                                               from "public"."post" as "root_posts"
                                               where "root_"."id" = "root_posts"."author_id" and "root_posts"."title" = ?)`,
				parameters: ['Hello'],
				response: {
					rows: [
						{
							root_id: testUuid(1),
						},
						{
							root_id: testUuid(3),
						},
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						id: testUuid(1),
					},
					{
						id: testUuid(3),
					},
				],
			},
		},
	})
})

