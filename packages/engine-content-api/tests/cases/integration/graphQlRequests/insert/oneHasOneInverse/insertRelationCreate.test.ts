import { test } from 'uvu'
import { execute, sqlTransaction } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('insert setting with site (one has one inverse relation)', async () => {
	await execute({
		schema: new SchemaBuilder()
			.entity('Site', entity =>
				entity
					.column('name', c => c.type(Model.ColumnType.String))
					.oneHasOne('setting', r => r.target('SiteSetting').inversedBy('site')),
			)
			.entity('SiteSetting', e => e.column('url', c => c.type(Model.ColumnType.String)))
			.buildSchema(),
		query: GQL`
        mutation {
          createSiteSetting(data: {url: "https://mangoweb.cz", site: {create: {name: "Mangoweb"}}}) {
		          node {
				          id
		          }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "url")
						insert into "public"."site_setting" ("id", "url")
						select "root_"."id", "root_"."url"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), 'https://mangoweb.cz'],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
						insert into "public"."site" ("id", "name", "setting_id")
						select "root_"."id", "root_"."name", "root_"."setting_id"
            from "root_"
						returning "id"`,
					parameters: [testUuid(2), 'Mangoweb', testUuid(1)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."site_setting" as "root_"
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
				createSiteSetting: {
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})
test.run()
