import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../src/test'
import { c, createSchema } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

namespace TestModel {
	export class Article {
		content = c.manyHasOne(ArticleContent)
	}

	export class ArticleContent {
		locales = c.oneHasMany(ArticleContentLocale, 'content')
	}

	export class ArticleContentLocale {
		content = c.manyHasOne(ArticleContent, 'locales')
		title = c.stringColumn()
		locale = c.stringColumn()
	}
}

test('failed to insert in sub-operation', async () => {
	await execute({
		schema: createSchema(TestModel).model,
		query: GQL`
          mutation {
              createArticle(data: {content: {create: {locales: [{create: {locale: "en", title: "Title"}}]}}}) {
                  ok
              }
          }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id") insert into  "public"."article_content" ("id") select "root_"."id"  from "root_"  returning "id"`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ id: testUuid(2) }],
					},
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "content_id") insert into  "public"."article_content_locale" ("id", "title", "locale", "content_id") select "root_"."id", "root_"."title", "root_"."locale", "root_"."content_id"  from "root_"  returning "id"`,
					parameters: [testUuid(3), 'Title', 'en', testUuid(2)],
					response: {
						rows: [],
					},
				},
			]),
		],
		return: {
			data: {
				createArticle: {
					ok: false,
				},
			},
		},
	})
})


test('failed to insert in sub-operation in update', async () => {
	await execute({
		schema: createSchema(TestModel).model,
		query: GQL`
          mutation {
              updateArticle(by: {id: "${testUuid(10)}"}, data: {content: {create: {locales: [{create: {locale: "en", title: "Title"}}]}}}) {
                  ok
              }
          }`,
		executes: [
			...failedTransaction([
				{
					sql: `select "root_"."id"  from "public"."article" as "root_"  where "root_"."id" = ?`,
					parameters: [testUuid(10)],
					response: {
						rows: [{ id: testUuid(10) }],
					},
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id") insert into  "public"."article_content" ("id") select "root_"."id"  from "root_"  returning "id"`,
					parameters: [testUuid(1)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
				{
					sql: SQL`with "root_" as (select ? :: uuid as "id", ? :: text as "title", ? :: text as "locale", ? :: uuid as "content_id") insert into  "public"."article_content_locale" ("id", "title", "locale", "content_id") select "root_"."id", "root_"."title", "root_"."locale", "root_"."content_id"  from "root_"  returning "id"`,
					parameters: [testUuid(2), 'Title', 'en', testUuid(1)],
					response: {
						rows: [],
					},
				},
			]),
		],
		return: {
			data: {
				updateArticle: {
					ok: false,
				},
			},
		},
	})
})

