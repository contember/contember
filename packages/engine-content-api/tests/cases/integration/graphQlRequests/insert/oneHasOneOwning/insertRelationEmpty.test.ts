import { test } from 'vitest'
import { execute, sqlTransaction } from '../../../../../src/test'
import { SchemaBuilder } from '@contember/schema-definition'
import { Model } from '@contember/schema'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'

test('insert site with empty settings', async () => {
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
          createSite(data: {name: "Mangoweb"}) {
		          node {
				          id
		          }
          }
        }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`with "root_" as
						(select ? :: uuid as "id", ? :: text as "name", ? :: uuid as "setting_id")
						insert into "public"."site" ("id", "name", "setting_id")
						select "root_"."id", "root_"."name", "root_"."setting_id"
            from "root_"
						returning "id"`,
					parameters: [testUuid(1), 'Mangoweb', null],
					response: { rows: [{ id: testUuid(1) }] },
				},
				{
					sql: SQL`select "root_"."id" as "root_id"
                     from "public"."site" as "root_"
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
				createSite: {
					node: {
						id: testUuid(1),
					},
				},
			},
		},
	})
})

