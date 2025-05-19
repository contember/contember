import { test } from 'bun:test'
import { execute, failedTransaction, sqlTransaction } from '../../../../src/test'
import { c, createSchema, SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../src/tags'
import { testUuid } from '../../../../src/testUuid'

test('applies a filter', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Author', e => e.column('name', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`mutation {
        updateAuthor(
            by: {id: "${testUuid(1)}"},
            filter: {name: {eq: "Jack"}},
            data: {name: "John"}
          ) {
          ok
          author: node {
            id
          }
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."author" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "newData_" as (select ? :: text as "name", "root_"."name" as "name_old__", "root_"."id"  from "public"."author" as "root_"  where "root_"."id" = ? and "root_"."name" = ?) 
							update  "public"."author" set  "name" =  "newData_"."name"   from "newData_"  where "author"."id" = "newData_"."id"  returning "name_old__"`,
					parameters: ['John', testUuid(1), 'Jack'],
					response: { rows: [{ name_old__: 'Jack' }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."author" as "root_"
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
				updateAuthor: {
					ok: true,
					author: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})


namespace FilterModel {
	export class Article {
		publishedAt = c.dateTimeColumn()
		tags = c.manyHasMany(Tag)
	}

	export class Tag {
		name = c.stringColumn()
	}
}

test('applies a filter with only relation update', async () => {
	await execute({
		schema: createSchema(FilterModel).model,
		query: GQL`mutation {
        updateArticle(
            by: {id: "${testUuid(1)}"},
            filter: {publishedAt: {isNull: false}},
            data: {tags: {connect: {id: "${testUuid(2)}"}}}
          ) {
          ok
          errorMessage
        }
      }`,
		executes: [
			...failedTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."article" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select count(*) as "row_count"  from "public"."article" as "root_"  where not("root_"."published_at" is null) and "root_"."id" = ?`,
					parameters: [testUuid(1)],
					response: { rows: [{ row_count: 0 }] },
				},
			]),
		],
		return: {
			data: {
				updateArticle: {
					ok: false,
					errorMessage: `Execution has failed:\nunknown field: NotFoundOrDenied (for input {\"and\":[{\"publishedAt\":{\"isNull\":false}},{\"id\":{\"eq\":\"123e4567-e89b-12d3-a456-000000000001\"}}]})`,
				},
			},
		},
	})
})
