import { test } from 'vitest'
import { execute } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags.js'

test('order by desc nulls last', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', entity => entity.column('title'))
			.buildSchema(),
		query: GQL`
        query {
          listPost(orderBy: {title: descNullsLast}) {
            id
          }
        }`,
		executes: [
			{
				sql: SQL`select
                       "root_"."id" as "root_id"
                     from "public"."post" as "root_" order by "root_"."title" desc nulls last, "root_"."id" asc`,
				response: {
					rows: [],
				},
			},
		],
		return: {
			data: {
				listPost: [],
			},
		},
	})
})

