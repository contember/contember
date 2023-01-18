import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '@contember/engine-api-tester'

test('create posts and connect/create author (exists, many has one)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', e =>
				e.column('publishedAt', c => c.type(Model.ColumnType.DateTime)).manyHasOne('author', r => r.target('Author')),
			)
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String).unique()))
			.buildSchema(),
		query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            author: {connectOrCreate: {connect: {name: "John"}, create: {name: "John"}}}
          }) {
			ok
          }
        }
      `,
		executes: [
			...sqlTransaction([
				{
					sql: `select "root_"."id" from "public"."author" as "root_" where "root_"."name" = ?`,
					parameters: ['John'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: `with "root_" as (select ? :: uuid as "id", ? :: timestamptz as "published_at", ? :: uuid as "author_id")
					insert into  "public"."post" ("id", "published_at", "author_id") select "root_"."id", "root_"."published_at", "root_"."author_id"  from "root_"  returning "id"`,
					parameters: [testUuid(1), '2018-06-11', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
})


test('create posts and connect/create author (not exists, many has one)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Post', e =>
				e.column('publishedAt', c => c.type(Model.ColumnType.DateTime)).manyHasOne('author', r => r.target('Author')),
			)
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String).unique()))
			.buildSchema(),
		query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            author: {connectOrCreate: {connect: {name: "John"}, create: {name: "John"}}}
          }) {
			ok
          }
        }
      `,
		executes: [
			...sqlTransaction([
				{
					sql: `select "root_"."id" from "public"."author" as "root_" where "root_"."name" = ?`,
					parameters: ['John'],
					response: { rows: [] },
				},
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
					sql: `with "root_" as (select ? :: uuid as "id", ? :: timestamptz as "published_at", ? :: uuid as "author_id")
					insert into  "public"."post" ("id", "published_at", "author_id") select "root_"."id", "root_"."published_at", "root_"."author_id"  from "root_"  returning "id"`,
					parameters: [testUuid(1), '2018-06-11', testUuid(2)],
					response: { rows: [{ id: testUuid(1) }] },
				},
			]),
		],
		return: {
			data: {
				createPost: {
					ok: true,
				},
			},
		},
	})
})



