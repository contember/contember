import { test } from 'uvu'
import { execute, sqlTransaction } from '../../../../../src/test'
import { GQL, SQL } from '../../../../../src/tags'
import { testUuid } from '../../../../../src/testUuid'
import { siteSettingSchema } from './schema'

test('update', async () => {
	await execute({
		schema: siteSettingSchema,
		query: GQL`mutation {
        updateSiteSetting(
            by: {id: "${testUuid(2)}"},
            data: {site: {update: {name: "Mangoweb"}}}
          ) {
          ok
        }
      }`,
		executes: [
			...sqlTransaction([
				{
					sql: SQL`select "root_"."id" from "public"."site_setting" as "root_" where "root_"."id" = ?`,
					parameters: [testUuid(2)],
					response: { rows: [{ id: testUuid(2) }] },
				},
				{
					sql: SQL`select "root_"."id"
                       from "public"."site" as "root_"
                       where "root_"."setting_id" = ?`,
					parameters: [testUuid(2)],
					response: {
						rows: [{ id: testUuid(1) }],
					},
				},
				{
					sql: SQL`
						with "newData_" as
						(select ? :: text as "name", "root_"."id", "root_"."setting_id"  from "public"."site" as "root_"  where "root_"."id" = ?)
						update  "public"."site" set  "name" =  "newData_"."name"
 						from "newData_"  where "site"."id" = "newData_"."id"`,
					parameters: ['Mangoweb', testUuid(1)],
					response: { rowCount: 1 },
				},
			]),
		],
		return: {
			data: {
				updateSiteSetting: {
					ok: true,
				},
			},
		},
	})
})
test.run()
