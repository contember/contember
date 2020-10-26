import { Model } from '@contember/schema'
import { execute, sqlTransaction } from '../../src/test'
import { GQL, SQL } from '../../src/tags'
import { testUuid } from '../../src/testUuid'
import { SchemaBuilder } from '@contember/schema-definition'
import { test } from 'uvu'

const schema = new SchemaBuilder()
	.entity('FrontPage', entity =>
		entity.column('title', column => column.type(Model.ColumnType.String)).oneHasOne('site', c => c.target('Site')),
	)
	.entity('Site', entity => entity.column('slug', column => column.type(Model.ColumnType.String).unique()))
	.buildSchema()

test('Update by nested unique where', async () => {
	await execute({
		schema: schema,
		query: GQL`
      mutation {
        updateFrontPage(data: {title: "Hello"}, by: {site: {slug: "en"}}) {
          ok
        }
      }  `,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."front_page" as "root_"
    left join "public"."site" as "root_site" on "root_"."site_id" = "root_site"."id"
		where "root_site"."slug" = ?`,
					response: { rows: [{ id: testUuid(1) }] },
					parameters: ['en'],
				},
				{
					sql: SQL`with "newData_" as
    (select ? :: text as "title", "root_"."id", "root_"."site_id"
    from "public"."front_page" as "root_"
        left join "public"."site" as "root_site" on "root_"."site_id" = "root_site"."id"
    where "root_site"."slug" = ?)
		update "public"."front_page" set "title" = "newData_"."title" from "newData_" where "front_page"."id" = "newData_"."id"`,
					response: { rowCount: 1 },
					parameters: ['Hello', 'en'],
				},
			]),
		],
		return: {
			data: {
				updateFrontPage: {
					ok: true,
				},
			},
		},
	})
})

test.run()
