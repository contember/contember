import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('insert posts with author (many has one)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', e =>
				e.column('publishedAt', c => c.type(Model.ColumnType.DateTime)).manyHasOne('author', r => r.target('Author')),
			)
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            author: {create: {name: "John"}}
          }) {
		          node {
				          id
		          }
          }
        }
      `,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name")
						insert into "public"."author" ("id", "name")
						select "root_"."id", "root_"."name"
            from "root_"
						returning "id"`,
					parameters: [testUuid(2), 'John'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: timestamptz as "published_at", ? :: uuid as "author_id")
						insert into "public"."post" ("id", "published_at", "author_id")
						select "root_"."id", "root_"."published_at", "root_"."author_id"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), '2018-06-11', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."post" as "root_"
                     where "root_"."id" = ?`,
					response: {
						rows: [{ root_id: testUuid(1) }],
					},
					parameters: [testUuid(1)],
				},
			]),
		],
		return: {
			data: {
				createPost: {
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})


