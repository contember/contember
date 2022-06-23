import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test.js'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags.js'
import { testUuid } from '../../../../../src/testUuid.js'

test('insert posts with locales (one has many)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.enum('locale', ['cs', 'en'])
			.entity('Post', e =>
				e
					.column('publishedAt', c => c.type(Model.ColumnType.DateTime))
					.oneHasMany('locales', r => r.target('PostLocale')),
			)
			.entity('PostLocale', e =>
				e
					.column('locale', c => c.type(Model.ColumnType.Enum, { enumName: 'locale' }))
					.column('title', c => c.type(Model.ColumnType.String)),
			)
			.buildSchema(),
		query: GQL`
        mutation {
          createPost(data: {
            publishedAt: "2018-06-11",
            locales: [
              {create: {locale: cs, title: "Ahoj svete"}}
              {create: {locale: en, title: "Hello world"}}
            ]
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
						(select ? :: uuid as "id", ? :: timestamptz as "published_at")
						insert into "public"."post" ("id", "published_at")
						select "root_"."id", "root_"."published_at"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), '2018-06-11'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "post_id", ? :: uuid as "id", ? :: text as "locale", ? :: text as "title")
						insert into "public"."post_locale" ("post_id", "id", "locale", "title")
						select "root_"."post_id", "root_"."id", "root_"."locale", "root_"."title"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), testUuid(2), 'cs', 'Ahoj svete'],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "post_id", ? :: uuid as "id", ? :: text as "locale", ? :: text as "title")
						insert into "public"."post_locale" ("post_id", "id", "locale", "title")
						select "root_"."post_id", "root_"."id", "root_"."locale", "root_"."title"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), testUuid(3), 'en', 'Hello world'],
					response: { rows: [{ id: testUuid(3) }] },
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

