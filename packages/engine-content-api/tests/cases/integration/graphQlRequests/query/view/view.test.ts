import { test } from 'vitest'
import { execute } from '../../../../../src/test.js'
import { SchemaDefinition as def } from '@contember/schema-definition'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

namespace TestModel {
	export class Author {
		name = def.stringColumn()
		stats = def.oneHasOneInverse(AuthorStats, 'author')
	}

	@def.View('SELECT 1') // not important here
	export class AuthorStats {
		author = def.oneHasOne(Author, 'stats')
		postCount = def.intColumn().notNull()
	}
}

test('query a view through a relation', async () => {
	await execute({
		schema: def.createModel(TestModel),
		query: GQL`
        query {
          listAuthor {
			name
			stats {
				postCount
			}
          }
        }`,
		executes: [
			{
				sql: SQL`select "root_"."name" as "root_name", "root_"."id" as "root_id", "root_"."id" as "root_id"
					from "public"."author" as "root_"`,
				response: {
					rows: [
						{ root_id: testUuid(1), root_name: 'John' },
						{ root_id: testUuid(2), root_name: 'Jack' },
					],
				},
				parameters: [],
			},
			{
				sql: SQL`
					select "root_"."author_id" as "root_author", "root_"."post_count" as "root_postCount", "root_"."id" as "root_id"
					from "public"."author_stats" as "root_"
					where "root_"."author_id" in (?, ?)`,
				parameters: [testUuid(1), testUuid(2)],
				response: {
					rows: [
						{
							root_id: null,
							root_author: testUuid(1),
							root_postCount: 2,
						},
						{
							root_id: null,
							root_author: testUuid(2),
							root_postCount: 3,
						},
					],
				},
			},
		],
		return: {
			data: {
				listAuthor: [
					{
						name: 'John',
						stats: {
							postCount: 2,
						},
					},
					{
						name: 'Jack',
						stats: {
							postCount: 3,
						},
					},
				],
			},
		},
	})
})

