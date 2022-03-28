import { test } from 'vitest'
import { execute } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('Post by author name (where many has one)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.manyHasOne('author', relation => relation.target('Author')))
			.entity('Author', entity => entity.column('name', column => column.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        query {
          listPost(filter: {author: {name: {eq: "John"}}}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_" left join "public"."author" as "root_author" on "root_"."author_id" = "root_author"."id"
                     where "root_author"."name" = ?`,
				parameters: ['John'],
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
				listPost: [
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

